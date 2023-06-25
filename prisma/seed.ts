import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const palettes = await prisma.palette.findMany()
    if (palettes.length === 0) {
        await prisma.palette.create({
            data: {
              genColors: "#166088,#660094,red,orange,#d106c7",
              name: 'Default',
            }
        })
        await prisma.palette.create({
          data: {
            genColors: "#ffa500,#d106c7,#cc8899",
            name: 'Simple Purple',
          }
      })
    }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })