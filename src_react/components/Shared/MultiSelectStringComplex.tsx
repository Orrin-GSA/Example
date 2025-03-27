// import React, { useEffect, useState } from "react";
// import Select, { StylesConfig, OptionProps, components  } from 'react-select';

// export type SelectStringProps = Omit<OptionProps, 'value' | 'onChange' | 'options'> & { value: string, size?: string, onChange: (value: string) => void, options: MultiSelectStringOption[] };
// export type MultiSelectStringOption = { label: string, value: string };

// // https://github.com/JedWatson/react-select/issues/2345#issuecomment-843674624
// // With small variations to use bootstrap styling, and to make text box use ellipsis if too long.

// function getSelectStyles(multi, size='') {
// 	const suffix = size ? `-${size}` : '';
// 	const multiplicator = multi ? 2 : 1;
// 	return {
// 		control: (provided, { isDisabled, isFocused }) => ({
// 			...provided,
// 			backgroundColor: `var(--bs-select${isDisabled ? '-disabled' : ''}-bg)`,
// 			borderColor: `var(--bs-select${isDisabled ? '-disabled' : (isFocused ? '-focus' : '')}-border-color)`,
// 			borderWidth: "var(--bs-select-border-width)",
// 			lineHeight: "var(--bs-select-line-height)",
// 			fontSize: `var(--bs-select-font-size${suffix})`,
// 			fontWeight: "var(--bs-select-font-weight)",
// 			minHeight: `calc((var(--bs-select-line-height)*var(--bs-select-font-size${suffix})) + (var(--bs-select-padding-y${suffix})*2) + (var(--bs-select-border-width)*2))`,
// 			':hover': {
// 				borderColor: "var(--bs-select-focus-border-color)",
// 			},
//             borderStyle: undefined, 
//             borderRadius: undefined, 
// 		}),
// 		singleValue: ({marginLeft, marginRight, ...provided}, { isDisabled }) => ({
// 			...provided,
// 			color: `var(--bs-select${isDisabled ? '-disabled' : ''}-color)`,
// 		}),
// 		valueContainer: (provided, state) => ({
// 			...provided,
//             padding: `calc(var(--bs-select-padding-y${suffix})/${multiplicator}) calc(var(--bs-select-padding-x${suffix})/${multiplicator})`,		
//             textOverflow: "ellipsis",
//             //maxWidth: "90%",
//             whiteSpace: "nowrap",
//             display: "inline-block",
//             overflowX: "hidden"
//         }),
// 		dropdownIndicator: (provided, state) => ({
// 			height: "100%",
// 			width: "var(--bs-select-indicator-padding)",
// 			backgroundImage: "var(--bs-select-indicator)",
// 			backgroundRepeat: "no-repeat",
// 			backgroundPosition: `right var(--bs-select-padding-x) center`,
// 			backgroundSize: "var(--bs-select-bg-size)",			
// 		}),
// 		input: ({margin, paddingTop, paddingBottom, ...provided}, state) => ({
// 			...provided,
//             // TODO: position: fixed is the only way to keep the text from overflowing backwards, but then the input for searching is awkwardly low...
//             position: 'fixed',
//             //top: '-7px',
//             caretColor: 'transparent'
// 		}),
// 		option: (provided, state) => ({
// 			...provided,
// 			margin: `calc(var(--bs-select-padding-y${suffix})/2) calc(var(--bs-select-padding-x${suffix})/2)`,
// 		}),
// 		menu: ({marginTop, ...provided}, state) => ({
// 			...provided
// 		}),
// 		multiValue: (provided, state) => ({
// 			...provided,
// 			margin: `calc(var(--bs-select-padding-y${suffix})/2) calc(var(--bs-select-padding-x${suffix})/2)`,
// 		}),
// 		clearIndicator: ({padding, ...provided}, state) => ({
// 			...provided,
// 			alignItems: "center",
// 			justifyContent: "center",
// 			height: "100%",
// 			width: "var(--bs-select-indicator-padding)"
// 		}),
// 		multiValueLabel: ({padding, paddingLeft, fontSize, ...provided}, state) => ({
// 			...provided,
// 			padding: `0 var(--bs-select-padding-y${suffix})`,
// 			whiteSpace: "normal"
// 		})
// 	}
// }

// function IndicatorSeparator() {
// 	return null;
// }

// function DropdownIndicator(props) {
// 	return (
// 		<components.DropdownIndicator {...props}>
// 			<span></span>
// 		</components.DropdownIndicator>
// 	);
// }

// function getSelectTheme(theme) {
// 	return {
// 		...theme,
// 		borderRadius: "var(--bs-select-border-radius)",
// 		colors: {
// 			...theme.colors,
// 			primary: "var(--bs-primary)",
// 			danger: "var(--bs-danger)",
// 		}
// 	}
// }

// const MultiValueContainer = ({ selectProps, data }) => {
//     if(selectProps.inputValue) {
//         return '';
//     }

//     const label = data.label;
//     const allSelected = selectProps.value;
//     const index = allSelected.findIndex(selected => selected.label === label);
//     const isLastSelected = index === allSelected.length - 1;
//     const labelSuffix = isLastSelected ? `` : ", ";
//     const val = `${label}${labelSuffix}`;
//     return val;
//   };

// /** A  wrapper for react-select package, that prevents text-overflow in the box. It takes a value that is assumed to be a comma-separated string, and returns the selected values as a comma-separated string. */
// function MultiSelectStringComplex(props: SelectStringProps) {
//     const { value, onChange, options, isDisabled, size, ...otherProps } = props;

//     const [selectedValues, setSelectedValues] = useState<MultiSelectStringOption[]>(() => {
//         const values = value?.split(',').map(x => options.find(opt => opt.value === x.trim())).filter(x => x) ?? [];
//         return values;
//     });

//     // resets the selection if the value is changed externally, IE a new project is selected in offcanvas.
//     useEffect(() => {
//         const values = value?.split(',').map(x => options.find(opt => opt.value === x.trim())).filter(x => x) ?? [];
//         setSelectedValues(values);
//     }, [value]);

//     const onValueChange = (options: MultiSelectStringOption[]) => {
//         setSelectedValues(options);
//         const result = options.map(x => x.value).join(', ');
//         onChange(result);
//     }

//     return <>
//         <Select {...otherProps}
//         className="form-control p-0"
//         options={options}
//         value={selectedValues}
//         onChange={onValueChange}
//         isMulti
//         hideSelectedOptions={false}
//         closeMenuOnSelect={false}
//         components={{ ...components, DropdownIndicator, IndicatorSeparator, MultiValueContainer }}
//         theme={getSelectTheme}
//         isSearchable
//         styles={getSelectStyles("isMulti" in props, size)}
//         />
//     </>;
// }

// export default MultiSelectStringComplex;