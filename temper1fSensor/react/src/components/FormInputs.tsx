import {
    FormControl,
    FormControlLabel,
    FormHelperText,
    InputLabel,
    RadioGroup,
    Select,
    SelectProps,
    TextareaAutosize,
    TextField,
    Switch,
} from '@mui/material';
import { useRadioGroup } from '@mui/material/RadioGroup';
import { FormControlLabelProps } from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';
import { ForwardedRef, forwardRef } from 'react';

export const StyledTextField = styled(TextField)`
    width: clamp(50%, 500px, 100%);

    & .MuiInputBase-root {
        background-color: white;
    }
`;

type Props<T> = SelectProps<T> & {
    helperText?: string;
};

export const StyledSwitch = styled(Switch)`
    margin-left: 15px;
`;

const StyledSelectWithRef = <T,>(
    { label, helperText, children, ...props }: Props<T>,
    ref: ForwardedRef<typeof Select>
) => {
    return (
        <StyledSelectField>
            <InputLabel id="coord-id">{label}</InputLabel>
            <Select {...props} label={label} labelId="coord-id" ref={ref}>
                {children}
            </Select>
            <FormHelperText error={props.error}>{helperText ?? ''}</FormHelperText>
        </StyledSelectField>
    );
};
export const StyledSelect = forwardRef(StyledSelectWithRef);

export const StyledSelectField = styled(FormControl)`
    width: clamp(50%, 500px, 100%);

    & .MuiInputBase-root {
        background-color: white;
    }
`;

export const StyledTextareaAutosize = styled(TextareaAutosize)`
    background-color: white;
    line-height: 1.5;
    padding: 8px 12px;
    border-radius: 4px;
    color: grey;
    border: 1px solid grey;
    box-shadow: 0px 2px 2px gray;
    outline: none;

    &:hover {
        border-color: black;
        box-shadow: 0px 2px 2px black;
    }

    &:focus {
        border-color: #1976d2;
        box-shadow: 0px 2px 2px #1976d2;
    }
`;

export const StyledRadioGroup = styled(RadioGroup)`
    padding: 0 12px;
`;

interface StyledFormControlLabelProps extends FormControlLabelProps {
    checked: boolean;
}

const StyledFormControlLabel = styled((props: StyledFormControlLabelProps) => <FormControlLabel {...props} />)(
    ({ theme }) => ({
        variants: [
            {
                props: { checked: true },
                style: {
                    '.MuiFormControlLabel-label': {
                        color: theme.palette.info.main,
                    },
                },
            },
        ],
    })
);

export const StyledRadioControlLabel = (props: FormControlLabelProps) => {
    const radioGroup = useRadioGroup();

    let checked = false;

    if (radioGroup) {
        checked = radioGroup.value === props.value;
    }

    return <StyledFormControlLabel checked={checked} {...props} />;
};
