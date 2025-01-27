import 'server-only';
// import { PrismaClient, Product } from '@prisma/client';

// const prisma = new PrismaClient();

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
