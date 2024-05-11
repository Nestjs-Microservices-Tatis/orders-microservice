import { IsEnum, IsOptional } from "class-validator";
import { PaginationDto } from "src/common";
import { OrderStatus } from '@prisma/client';
import { OrderStatusList } from "../enum/order.enum";

export class FilterOrderDto extends PaginationDto{

    @IsOptional()
    @IsEnum( OrderStatusList, {
        message: `Valid status are ${ OrderStatusList }`
    })
    status: OrderStatus;

}