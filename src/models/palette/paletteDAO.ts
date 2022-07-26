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

export async function savePalette(paletteObject: PaletteDAO): Promise<PaletteDAO> {
    const prisma = new PrismaClient();
    let retPalette: PaletteDAO;

    await prisma.palette.create({
        data: DAOToModel(paletteObject)
    }).then(palette => {
        retPalette = ModelToDAO(palette);
    }).catch(err => {
        console.log(err);
    });

    return retPalette;
}

export async function loadPalettes(): Promise<PaletteDAO[]> {
    const prisma = new PrismaClient();
    let retPalettes: Palette[] | void = [];

    retPalettes = await prisma.palette.findMany().catch(err => {
        console.log(err);
    });

    if (retPalettes) {
        return retPalettes.map(p => ModelToDAO(p));
    } else {
        return null;
    }
}

export async function removePalette(genColors: string) : Promise<boolean> {
    const prisma = new PrismaClient();
    let ret: boolean;

    await prisma.palette.deleteMany({
        where: {
            genColors: {
                equals: genColors
            }
        }
    }).then( palettes => {
        ret = true;
    }).catch(err => {
        console.log(err);
        ret = false;
    });

    return ret;
}