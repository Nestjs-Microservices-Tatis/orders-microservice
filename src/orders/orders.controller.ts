import { Controller, NotImplementedException, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { PaginationDto } from 'src/common';
import { CreateOrderDto, ChangeOrderStatusDto, FilterOrderDto } from './dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({cmd: 'create_order'})
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern({cmd: 'find_all_orders'})
  findAll(@Payload() filterOrderDto: FilterOrderDto ) {
    return this.ordersService.findAll(filterOrderDto);
  }

  @MessagePattern({cmd: 'find_one_order'})
  findOne(@Payload("id", ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern({ cmd: "change_order_status"})
  changeOrderStatus(@Payload() changeOrderStatusDto: ChangeOrderStatusDto){
    return this.ordersService.changeOrderStatus(changeOrderStatusDto);
  }


 
}
