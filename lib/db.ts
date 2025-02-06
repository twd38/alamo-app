import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import ws from 'ws'

const connectionString = `${process.env.DATABASE_URL}`

const pool = new Pool({ connectionString })
const adapter = new PrismaNeon(pool)
 
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;





// export async function getProducts(
//   search: string,
//   offset: number
// ): Promise<{
//   products: Product[];
//   newOffset: number | null;
//   totalProducts: number;
// }> {
//   if (search) {
//     const products = await prisma.product.findMany({
//       where: {
//         name: {
//           contains: search,
//           mode: 'insensitive'
//         }
//       },
//       take: 1000
//     });
//     return {
//       products,
//       newOffset: null,
//       totalProducts: 0
//     };
//   }

//   if (offset === null) {
//     return { products: [], newOffset: null, totalProducts: 0 };
//   }

//   const [totalProducts, products] = await Promise.all([
//     prisma.product.count(),
//     prisma.product.findMany({
//       take: 5,
//       skip: offset
//     })
//   ]);

//   const newOffset = products.length >= 5 ? offset + 5 : null;

//   return {
//     products,
//     newOffset,
//     totalProducts
//   };
// }

// export async function deleteProductById(id: number) {
//   await prisma.product.delete({
//     where: { id }
//   });
// }
