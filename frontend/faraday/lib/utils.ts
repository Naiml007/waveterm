// Copyright 2024, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { CSSProperties } from "react";
import { XYCoord } from "react-dnd";

export interface Dimensions {
    width: number;
    height: number;
    left: number;
    top: number;
}

export enum DropDirection {
    Top = 0,
    Right = 1,
    Bottom = 2,
    Left = 3,
    OuterTop = 4,
    OuterRight = 5,
    OuterBottom = 6,
    OuterLeft = 7,
    Center = 8,
}

export enum FlexDirection {
    Row = "row",
    Column = "column",
}

export function reverseFlexDirection(flexDirection: FlexDirection): FlexDirection {
    return flexDirection === FlexDirection.Row ? FlexDirection.Column : FlexDirection.Row;
}

export function determineDropDirection(dimensions?: Dimensions, offset?: XYCoord | null): DropDirection | undefined {
    console.log("determineDropDirection", dimensions, offset);
    if (!offset || !dimensions) return undefined;
    const { width, height, left, top } = dimensions;
    let { x, y } = offset;
    x -= left;
    y -= top;

    // Lies outside of the box
    if (y < 0 || y > height || x < 0 || x > width) return undefined;

    // Determines if a drop point falls within the center fifth of the box, meaning we should return Center.
    const centerX1 = (2 * width) / 5;
    const centerX2 = (3 * width) / 5;
    const centerY1 = (2 * height) / 5;
    const centerY2 = (3 * height) / 5;

    if (x > centerX1 && x < centerX2 && y > centerY1 && y < centerY2) return DropDirection.Center;

    const diagonal1 = y * width - x * height;
    const diagonal2 = y * width + x * height - height * width;

    // Lies on diagonal
    if (diagonal1 == 0 || diagonal2 == 0) return undefined;

    let code = 0;

    if (diagonal2 > 0) {
        code += 1;
    }

    if (diagonal1 > 0) {
        code += 2;
        code = 5 - code;
    }

    // Determines whether a drop is close to an edge of the box, meaning drop direction should be OuterX, instead of X
    const xOuter1 = width / 5;
    const xOuter2 = width - width / 5;
    const yOuter1 = height / 5;
    const yOuter2 = height - height / 5;

    if (y < yOuter1 || y > yOuter2 || x < xOuter1 || x > xOuter2) {
        code += 4;
    }

    return code;
}

export function setTransform({ top, left, width, height }: Dimensions, setSize: boolean = true): CSSProperties {
    // Replace unitless items with px
    const translate = `translate(${left}px,${top}px)`;
    return {
        top: 0,
        left: 0,
        transform: translate,
        WebkitTransform: translate,
        MozTransform: translate,
        msTransform: translate,
        OTransform: translate,
        width: setSize ? `${width}px` : undefined,
        height: setSize ? `${height}px` : undefined,
        position: "absolute",
    };
}

export const debounce = <T extends (...args: any[]) => any>(callback: T, waitFor: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>): ReturnType<T> => {
        let result: any;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            result = callback(...args);
        }, waitFor);
        return result;
    };
};

/**
 * Simple wrapper function that lazily evaluates the provided function and caches its result for future calls.
 * @param callback The function to lazily run.
 * @returns The result of the function.
 */
export const lazy = <T extends (...args: any[]) => any>(callback: T) => {
    let res: ReturnType<T>;
    let processed = false;
    return (...args: Parameters<T>): ReturnType<T> => {
        if (processed) return res;
        res = callback(...args);
        processed = true;
        return res;
    };
};

/**
 * Workaround for NodeJS compatibility. Will attempt to resolve the Crypto API from the browser and fallback to NodeJS if it isn't present.
 * @returns The Crypto API.
 */
export function getCrypto() {
    try {
        return window.crypto;
    } catch {
        return crypto;
    }
}
