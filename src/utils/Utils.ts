
export enum Style {
    RED = 0,
    YELLOW = 1,
    GREEN = 2,
    CYAN = 3,
    BLUE = 4,
    MAGENTA = 5,
    ORANGE = 6
}

export function Contains(array: string[], target: string): boolean {
    return array.includes(target);
}

export function styleText(style: Style, text: string): string {
    const entry = "\x1b[";
    const escape = "\x1b[0m";

    let code: number;

    switch (style) {
        case Style.RED:
            code = 31;
            break;

        case Style.YELLOW:
            code = 33;
            break;

        case Style.GREEN:
            code = 32;
            break;

        case Style.CYAN:
            code = 36;
            break;

        case Style.BLUE:
            code = 34;
            break;

        case Style.MAGENTA:
            code = 35;
            break;

        default:
            code = 0;
            break;
    }

    return `${entry}${code}m${text}${escape}`;
}