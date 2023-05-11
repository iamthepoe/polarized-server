import {Author} from '@prisma/client'
import { authorsClient } from "../clients/clients.prisma";
import slugify from "slugify";

export class AuthorsService{
    private client: typeof authorsClient;
    constructor(client: typeof authorsClient){
        this.client = client;
    }

    async create(name: string){
        if(!name?.trim()) return {code: 400, data: null, message: `Empty values.`}
        try{
            const slug = slugify(name);
            const response = await this.client.create({
                data:{
                    name,
                    slug
                }
            });
            return {code: 201, data: response, message: 'Created with success.'};
        }catch{
            return {code: 500, data: null, message: 'Server internal error.'};
        }
    }
}