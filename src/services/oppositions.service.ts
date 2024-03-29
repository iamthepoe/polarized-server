import { oppositionsClient } from "../clients/clients.prisma";
import { validateFields } from '../utils/validation.util';
import slugify from "slugify";

export class OppositionsService{
    private client: typeof oppositionsClient;
    constructor(client: typeof oppositionsClient){
        this.client = client;
    }

    async create(data: {firstAuthorId: string, secondAuthorId: string}){
        const {firstAuthorId, secondAuthorId} = data;
        const errorMessage = validateFields(
            { value: firstAuthorId, label: "firstAuthorId" },
            { value: secondAuthorId, label: "secondAuthorId" }
         );

        if (errorMessage) return { code: 400, data: null, message: errorMessage };

        try{
            const authors = await this.client.authors.findMany({
                where: {
                    OR: [
                        {id: firstAuthorId},
                        {id: secondAuthorId}
                    ]
                },
                select: {
                    name: true
                }
            });

            if (authors.length < 2) return {code: 404, data: null, message: 'One or both authors not found.'};
            
            const slug = slugify(`${authors[0].name} ${authors[1].name}`, {lower: true});
            const response = await this.client.opposition.create({
                data: {
                    slug,
                    firstAuthorId,
                    secondAuthorId
                }
            });

            return {code: 201, data: response, message: 'Created with success.'};
        } catch {
            return {code: 500, data: null, message: 'Server internal error.'};
        }
    }

    async findById(id: string){
        try{
            const response = await this.client.opposition.findUnique({
                where: {id},
                    select: {
                        id: true,
                        slug: true,
                        firstAuthor: {
                            select:{
                                id: true,
                                name: true,
                                description: true
                            }
                        },
                        secondAuthor: {
                            select:{
                                id: true,
                                name: true,
                                description: true
                            }
                        }
                    }
            });

            if(!response) return {code: 404, data: null, message: 'Not found.'};

            return {code: 200, data: response, message: 'Finded.'};
        }catch{
            return {code: 500, data: null, message: 'Internal server error.'}
        }
    }
    
    async findMany(query?: string){
        try{
            const response = !!query 
                ? await this.client.opposition.findMany({
                    where: {slug: {contains: query}},
                    select: {
                        id: true,
                        slug: true,
                        firstAuthor: {
                            select:{
                                id: true,
                                name: true,
                                description: true
                            }
                        },
                        secondAuthor: {
                            select:{
                                id: true,
                                name: true,
                                description: true
                            }
                        }
                    }
                })
                : await this.client.opposition.findMany({
                    select: {
                        id: true,
                        slug: true,
                        firstAuthor: {
                            select:{
                                id: true,
                                name: true,
                                description: true
                            }
                        },
                        secondAuthor: {
                            select:{
                                id: true,
                                name: true,
                                description: true
                            }
                        }
                    }
                });
            return {code: 200, data: response, message: 'Finded!'};
        }catch{
            return {code: 500, data: null, message: 'Internal server error.'}
        }
    }

    async updateOne(id: string, data: {firstAuthorId?: string, secondAuthorId?: string}){
        const {firstAuthorId, secondAuthorId} = data;
        try{
            let response = await this.client.opposition.findUnique({
                where: {id},
                select: {

                    firstAuthor: {
                        select: {name: true}
                    },
                    secondAuthor: {
                        select: {name: true}
                    }
                }
            });

            if(!response) return {code: 404, data: null, message: 'Not found.'};

            if(firstAuthorId){
                var firstAuthor = await this.client.authors.findUnique({
                    where:{id: firstAuthorId},
                    select: {
                        name: true
                    }
                });
                if(!firstAuthor) return {code: 404, data: null, message: 'First author not found.'};
                response.firstAuthor.name = firstAuthor.name;
            }else{
                delete data['firstAuthorId'];
            }

            if(secondAuthorId){
                var secondAuthor = await this.client.authors.findUnique({
                    where:{id: secondAuthorId},
                    select: {
                        name: true
                    }
                });
                if(!secondAuthor) return {code: 404, data: null, message: 'Second author not found.'};
                response.secondAuthor.name = secondAuthor.name;
            }else{
                delete data['secondAuthorId'];
            }

            data['slug'] = slugify(`${response.firstAuthor.name} ${response.secondAuthor.name}`, 
                {lower: true}
            );
            
            let updateResponse = await this.client.opposition.update({
                where: {id},
                data
            });

            return {code: 200, data: updateResponse, message: 'Updated.'};
        }catch{
            return {code: 500, data: null, message: 'Internal server error.'}
        }
    }

    async deleteOne(id: string){
        try{
            let response = await this.client.opposition.findUnique({where:{id}});
            if(!response) return {code: 404, data: null, message: 'Not found.'};
            response = await this.client.opposition.delete({where:{id}});
            return {code: 204, data: response, message: 'Deleted.'};
        }catch{
            return {code: 500, data: null, message: 'Internal server error.'}
        }
    }

    async findPhrasesByOpposition(id: string){
        const authorSelect = {
            id: true,
            name: true,
            description: true,
            phrases: {
                select: {
                    id: true,
                    content: true,
                    source: true,
                    authorId: true
                }
            }
        }
        try{
            let response = await this.client.opposition.findUnique({
                where: {id},
                select: {
                    slug: true,
                    firstAuthor: {select: authorSelect},
                    secondAuthor: {select: authorSelect}
                }
            });

            if(!response) return {code: 404, data: null, message: 'Not found.'};

            return {code: 200, data: response, message: 'Finded.'}
        }catch{
            return {code: 500, data: null, message: 'Internal server error.'}
        }
    }
}