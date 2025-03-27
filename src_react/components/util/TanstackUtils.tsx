// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// import React from 'react';
// import {
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     Column,
//     ColumnDef,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     ColumnFiltersState,
//     RowData,
//     flexRender,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     getCoreRowModel,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     getPaginationRowModel,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     getSortedRowModel,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     useReactTable,
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     createColumnHelper,
//     Table,
// } from '@tanstack/react-table';
// import { useEffect, useState, useRef, useCallback } from "react";

// // Extending meta definitions in tanstack to include our custom features.
// declare module '@tanstack/react-table' {
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     interface TableMeta<TData extends RowData> {
//         /**
//          * Required if getDefaultEditableColumn is used.
//          * @param keyField The keyField must be in the columns (even hidden), and the column id and accessed field name must be the same.
//          * @param keyValue 
//          * @param columnId 
//          * @param value 
//          * @returns 
//          */
//         updateData?: (keyField: string, keyValue: any, columnId: string, value: unknown) => void
//     }
// }

// declare module '@tanstack/table-core' {
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars
//     interface ColumnMeta<TData, TValue> {
//         columnClass?: string,
//         title?: string
//     }
// }

// /** Builds a default column for editable cells. Can be set as the default for the table, or be used individually per column. */
// export function getDefaultEditableColumn<T>(keyField: Extract<string, keyof T>): Partial<ColumnDef<T>> {
//     return {
//         cell: ({ getValue, row: { original }, column: { id, columnDef }, table }) => {
//             const initialValue = getValue();

//             // We need to keep and update the state of the cell normally
//             const [value, setValue] = useState(initialValue);

//             // When the input is blurred, we'll call our table meta's updateData function
//             const onBlur = () => {
//                 const keyValue = original[keyField];
//                 table.options.meta?.updateData(keyField, keyValue, id, value);
//             }

//             // If the initialValue is changed external, sync it up with our state
//             useEffect(() => {
//                 setValue(initialValue)
//             }, [initialValue])

//             return (
//                 <input
//                     title={columnDef.meta?.title}
//                     value={value as string}
//                     onChange={e => setValue(e.target.value)}
//                     onBlur={onBlur}
//                 />
//             )
//         },
//     }
// }

// export function renderHeaderColumn<T = any>(table: Table<T>) {
//     return table.getHeaderGroups().map(headerGroup => (
//         <tr key={headerGroup.id}>
//             {headerGroup.headers.map(header => (
//                 <th key={header.id} colSpan={header.colSpan} className='text-center'>
//                     {header.isPlaceholder
//                         ? null
//                         : flexRender(
//                             header.column.columnDef.header,
//                             header.getContext()
//                         )}
//                 </th>
//             ))}
//         </tr>
//     ));
// }

// export function renderColumn<T = any>(table: Table<T>) {
//     return table.getRowModel().rows.map(row => (
//         <tr key={row.id}>
//             {row.getVisibleCells().map(cell => (
//                 <td key={cell.id} className={cell.column.columnDef.meta?.columnClass}>
//                     {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                 </td>
//             ))}
//         </tr>
//     ));
// }

// export function useSkipper() {
//     const shouldSkipRef = useRef(true);
//     const shouldSkip = shouldSkipRef.current;

//     // Wrap a function with this to skip a pagination reset temporarily
//     const skip = useCallback(() => {
//         shouldSkipRef.current = false
//     }, []);

//     useEffect(() => {
//         shouldSkipRef.current = true
//     });

//     return [shouldSkip, skip] as const;
// }