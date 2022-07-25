import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const palettes = await prisma.palette.findMany()
    if (palettes.length === 0) {
        await prisma.palette.create({
            data: {
              genColors: "purple,darkred,darkblue,red",
              name: 'Default',
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