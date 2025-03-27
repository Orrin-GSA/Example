// import React, { useEffect, useMemo, useState } from "react";
// import Select, { StylesConfig, OptionProps, components  } from 'react-select';

// export type SelectStringProps = Omit<OptionProps, 'value' | 'onChange' | 'options'> & { value: string, onChange: (value: string) => void, options: MultiSelectStringOption[] };
// export type MultiSelectStringOption = { label: string, value: string };

// const multiStringStyles: StylesConfig<MultiSelectStringOption, true> = {
//     control: (styles) => ({ ...styles, borderStyle: undefined, borderRadius: undefined, overflow: 'hidden' }),
//   };

// /** A simple wrapper for react-select package, this changes little about the package outside of some styling to fit in with bootstrap forms. It takes a value that is assumed to be a comma-separated string, and returns the selected values as a comma-separated string. */
// function MultiSelectStringSimple(props: SelectStringProps) {
//     const { value, onChange, options, isDisabled, ...otherProps } = props;

//     const  selectedValues = useMemo<MultiSelectStringOption[]>(() => {
//         const values = value?.split(',').map(x => options.find(opt => opt.value === x.trim())).filter(x => x) ?? [];
//         return values;
//     }, [value]);

//     const onValueChange = (options: MultiSelectStringOption[]) => {
//         const result = options.map(x => x.value).join(', ');
//         onChange(result);
//     }

//     return <>
//         <Select {...otherProps}
//         className="form-control p-0"
//         styles={multiStringStyles}
//         options={options}
//         value={selectedValues}
//         onChange={onValueChange}
//         closeMenuOnSelect={false}
//         isMulti
//         //components={{ MultiValueContainer: multiValueContainer }}
//         />
//     </>;
// }

// export default MultiSelectStringSimple;