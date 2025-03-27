import { useLayoutEffect } from "react";
import { DateTime } from "luxon";
import { toDateTime } from "../../util/DataUtil";

// I don't know why but getDate() was returning the current day - 1, which was then going back 1 month when converted to a new date.
export function getMonth(strDate) {
    const date = toDateTime(strDate);
    return date?.month ?? -1;
}

export const getFiscalMonthRange = (): DateTime[] => {
    const today = DateTime.now();
    return [
        DateTime.fromObject({ year: today.year - 1, month: 10, day: 1 }),
        DateTime.fromObject({ year: today.year - 1, month: 11, day: 1 }),
        DateTime.fromObject({ year: today.year - 1, month: 12, day: 1 }),
        DateTime.fromObject({ year: today.year, month: 1, day: 1 }),
        DateTime.fromObject({ year: today.year, month: 2, day: 1 }),
        DateTime.fromObject({ year: today.year, month: 3, day: 1 }),
        DateTime.fromObject({ year: today.year, month: 4, day: 1 }),
        DateTime.fromObject({ year: today.year, month: 5, day: 1 }),
        DateTime.fromObject({ year: today.year, month: 6, day: 1 }),
        DateTime.fromObject({ year: today.year, month: 7, day: 1 }),
        DateTime.fromObject({ year: today.year, month: 8, day: 1 }),
        DateTime.fromObject({ year: today.year, month: 9, day: 1 })
    ];
};

/**
 * 
 * @param year Year as returned by Date.getFullYear()
 * @param date date to check.
 * @returns 
 */
export const isInFiscalYear = (year: number, date: DateTime) => {    
    const from =  DateTime.fromObject({ year: year - 1, month: 10, day: 1 }).startOf('day');
    const to = DateTime.fromObject({ year: year, month: 9, day: 30 }).endOf('day');

    return date >= from && date <= to;
}

export const isInThisFiscalYear = (date: DateTime) => {
    return isInFiscalYear(new Date().getFullYear(), date);
}

/**
 * @param {React.MutableRefObject<any>} chartRef
 */
export function useResizeChart(chartRef) {
    useLayoutEffect(() => {
        const chart = chartRef.current;
        function updateResize() {
            if (chart) {
                chart.update('resize');
            }
        }
        console.log('Resize Setup');
        window.addEventListener('resize', updateResize);
        return () => window.removeEventListener('resize', updateResize);
    }, []);
}

export function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

const greyScaleMin = 75;
const greyScaleMax = 200;
const greyScaleRange = greyScaleMax - greyScaleMin;

// const colorMin = 120;
// const colorMax = 255;
// const colorRange = colorMax - colorMin;

export const backgroundColors = {
    // TODO: Add increments here, can just decide if we need to start doing combined colors at the get go.
    main() {
        return (idx) => {
            const color = idx % 3;
            const multiplier = Math.floor(idx / 3) + 1;
            const increment = 50;
            const initial = 120;

            const r = color == 0 ? (initial + multiplier * increment) : 0;
            const g = color == 1 ? (initial + multiplier * increment) : 0;
            const b = color == 2 ? (initial + multiplier * increment) : 0;

            return `rgb(${r}, ${g}, ${b})`;
        }
    },
    greyScale(increments) {
        const greyScaleIncrement = greyScaleRange / increments;
        return (idx) => `rgb(${greyScaleMax - idx * greyScaleIncrement}, ${greyScaleMax - (idx * greyScaleIncrement)}, ${greyScaleMax - (idx * greyScaleIncrement)})`;
    }
}


//const colors = (idx) => `rgb(${50 + idx * 50}, ${75 + idx * 10}, ${200 + idx * -40})`;