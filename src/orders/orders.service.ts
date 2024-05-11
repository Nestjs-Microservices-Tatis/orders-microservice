import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FilterOrderDto } from './dto/filter-order.dto';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { NATS_SERVICE, PRODUCT_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit{
  
  private readonly logger = new Logger("OrdersService");

  constructor(
    @Inject(NATS_SERVICE) private readonly Client: ClientProxy,
  ){
    super();
  }
  
  async onModuleInit() {
    await this.$connect();  
    this.logger.log("Database connected");
  }
  
  async create(createOrderDto: CreateOrderDto) {

    try{

      const productIds = createOrderDto.items.map(item => item.productId);

      const products: any[] = await firstValueFrom(
        this.Client.send({cmd: "validate_products"}, productIds)
      )

      //2. Calculamos 
      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
          const price = products.find(
            (product) => product.id === orderItem.productId
          ).price;
          return price * orderItem.quantity;
      }, 0);

      const totalItems = createOrderDto.items.reduce((acc, orderItem) => {
        return acc + orderItem.quantity;
      }, 0);

      //3 Crear una transaccion de BD
      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem:{
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: products.find( product => product.id === orderItem.productId).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity
              }))
            }
          }
        },
        include:{
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true
            },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId).name
        })) 
      }
    }
    catch(error){
      throw new RpcException(error);

    }


     
    //return this.order.create({
     // data: createOrderDto
    //});
  }

  async findAll(filterOrderDto: FilterOrderDto) {
    
    const { page, limit, status} = filterOrderDto;
    console.log(filterOrderDto);

    const totalPages = await this.order.count({
      where: {
        status: status
      } 
    });
    const lastPage = Math.ceil( totalPages / limit);

    return {
      data: await this.order.findMany({
        skip: ( page -1 ) * limit,
        take: limit,
        where:{
          status: status
        }
      }),
      meta: {
        total: totalPages,
        page: page,
        lastPage: lastPage
      }
    };
  }

  async findOne(id: string) {
      const order = await this.order.findFirst({
        where: {id: id},
        include:{
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true
            }
          }
        }
      });

      if( !order ){
        throw new RpcException({
          message: `Order with id #${ id } not found`,
          status: HttpStatus.NOT_FOUND
        });
      }

      const productIds = order.OrderItem.map((orderItem) => orderItem.productId);
      const products: any[] = await firstValueFrom(
        this.Client.send({cmd: "validate_products"}, productIds)
      )

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          name: products.find((product) => product.id === orderItem.productId).name
        })) 
      }
  }

  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    
      const { id, status } = changeOrderStatusDto;

      const orderStatus = await this.findOne(id);

      if(orderStatus.status === status){
        return orderStatus;
      }

      return this.order.update({
        where: { id },
        data: { status: status }
      });

  }

  
}
