import { Palette, PrismaClient } from "@prisma/client";

export interface PaletteDAO {
    name: string,
    genColors: string[],
}

function DAOToModel(dao: PaletteDAO) {
    return {
        name: dao.name,
        genColors: dao.genColors.join(',')
    }
}

function ModelToDAO(model: Palette): PaletteDAO {
    return {
        name: model.name,
        genColors: model.genColors.split(',')
    }
}

export function savePalette(paletteObject: PaletteDAO): void {
    const prisma = new PrismaClient();
    
    prisma.palette.create({
        data: DAOToModel(paletteObject)
    }).then(palette => {
        console.log(palette);
    }).catch(err => {
        console.log(err);
    });
}

export async function loadPalettes(): Promise<PaletteDAO[]> {
        const prisma = new PrismaClient();
        let retPalettes: Palette[] = [];
        await prisma.palette.findMany().then(palettes => {
            retPalettes = palettes;
        }).catch(err => {
            console.log(err);
        });
        return retPalettes.map(p => ModelToDAO(p));
}

export function removePalette(genColors: string) : void {
    const prisma = new PrismaClient();
    prisma.palette.deleteMany({
        where: {
            genColors: {
                equals: genColors
            }
        }
    }).then(palette => {
        console.log(palette);
    }).catch(err => {
        console.log(err);
    });
}