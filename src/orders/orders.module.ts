import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { NatsModule } from '../nats/nats.module';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  imports: [
    NatsModule
  ]
  /* imports:[
    ClientsModule.register([
      {
        name: PRODUCT_SERVICE,
        transport: Transport.TCP,
        options:{
          //host: envs.productsMicroserviceHost,
          //port: envs.productsMicroservicePort
        }
      }
    ])

  ]*/

})
export class OrdersModule {}
