import { Palette, PrismaClient } from "@prisma/client";

describe('Database CRUD operations tests', function() {
    var paletteId: number = 0;

    // Before all empty database and seed it
    beforeAll(async () => {
        const prisma = new PrismaClient();
        await prisma.palette.deleteMany({});
        const tmpObj = await prisma.palette.create({
            data: {
                name: 'Test palette',
                genColors: '#f9f9f9,#454545'
            }
        });
        await prisma.$disconnect();
        paletteId = tmpObj.id;
    }
    , 16000);

    test('Retrieval test', async () => {
        const prisma = new PrismaClient();
        let retPalette: Palette[] = [];

        await prisma.palette.findMany().then(palettes => {
            retPalette = palettes;
        }).catch(err => {
            console.log(err);
        }).finally(() => {
            prisma.$disconnect();
        });

        expect(retPalette.length).toBeGreaterThan(0);
    }, 5000);

    test('Creation and deletion test', async () => {
        const prisma = new PrismaClient();
        let retPalette: Palette[] = [];

        const paletteObject = {
            name: 'test',
            genColors: '#000000,#ffffff'
        };
        try {
            // Create
            await prisma.palette.create({
                data: paletteObject
            }).catch(err => {
                console.log(err);
            });

            // Retrieve and check
            await prisma.palette.findMany(
                {
                    where: {
                        genColors: {
                            equals: paletteObject.genColors
                        }
                    }
                }
            ).then(palettes => {
                retPalette = palettes
            }).catch(err => {
                console.log(err);
            });

            expect(retPalette.length).toBe(1);
        } finally {
            // Remove
            await prisma.palette.deleteMany({
                where: {
                    genColors: {
                        equals: paletteObject.genColors
                    }
                }
            })

            // Retrieve again and check
            await prisma.palette.findMany(
                {
                    where: {
                        genColors: {
                            equals: paletteObject.genColors
                        }
                    }
                }
            ).then(palettes => {
                retPalette = palettes;
            })

            expect(retPalette.length).toBe(0);

            prisma.$disconnect();
        }
    }, 5000);
    
    test('Update test', async () => {
        const prisma = new PrismaClient();
        let retPalette: Palette | null = null;

        const paletteObject = {
            name: 'Test palette',
            genColors: '#f9f9f9,#454545'
        };
        // Update
        await prisma.palette.update({
            select: {
                name: true,
                genColors: true
            },
            where: {
                id: paletteId
            },
            data: {
                name: 'Updated palette'
            }
        }).then().catch(err => {
            console.log(err);
        });

        // Retrieve and check
        await prisma.palette.findFirst(
            {
                where: {
                    genColors: {
                        equals: paletteObject.genColors
                    }
                }
            }
        ).then(palettes => {
            retPalette = palettes;
        }).catch(err => {
            console.log(err);
        });

        expect(retPalette).not.toBeNull();
        expect(retPalette!.name).toBe('Updated palette');
    });
    
    // After all tests flush database
    afterAll(async () => {
        const prisma = new PrismaClient();
        await prisma.palette.deleteMany({});
        prisma.$disconnect();
    }, 16000);
    
});
