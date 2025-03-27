import { Column } from '@tanstack/react-table';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from "react";
import DebouncedInput from './DebouncedInput';

export function TanstackFilter({ column }: { column: Column<any, unknown> }) {
    const columnFilterValue = column.getFilterValue();

    return (
        <DebouncedInput
            type="text"
            value={(columnFilterValue ?? '') as string}
            onChange={value => column.setFilterValue(value)}
            placeholder={`Search...`}
            className="w-36 border shadow rounded"
        />
    )
}