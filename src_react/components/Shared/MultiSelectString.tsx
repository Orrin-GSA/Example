import React, { useMemo } from "react";
import { MultiSelect, Option, SelectProps } from "react-multi-select-component";

export type SelectStringProps = Omit<SelectProps, 'value' | 'onChange'> & { value: string, onChange: (value: string) => void };

/** A variant of MultiSelect package, made to work with bootstrap styling, that takes a value that is assumed to be a comma-separated string, and returns the selected values as a comma-separated string. */
function MultiSelectString(props: SelectStringProps) {
    const { value, onChange, options, ...otherProps } = props;

    const  selectedValues = useMemo(() => {
        const values = value?.split(',').map(x => options.find(opt => opt.value === x.trim())).filter(x => x) ?? [];
        return values;
    }, [value]);

    const onValueChange = (options: Option[]) => {
        //setSelectedValues(options);
        const result = options.map(x => x.value).join(', ');
        onChange(result);
    }

    return <>
        <MultiSelect {...otherProps}
        className="form-control p-0 remove-border"
        options={options}
        value={selectedValues}
        onChange={onValueChange}
        />
    </>;
}

export default MultiSelectString;