import {
    FormControl,
    FormControlLabel,
    FormHelperText,
    InputLabel,
    Select,
    SelectProps,
    TextareaAutosize,
    TextField,
} from '@mui/material';
import { useRadioGroup } from '@mui/material/RadioGroup';
import { FormControlLabelProps } from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';
import { ForwardedRef, forwardRef } from 'react';

export const StyledTextField = styled(TextField)`
    width: clamp(50%, 600px, 100%);

    & .MuiInputBase-root {
        background-color: white;
    }

    & .MuiInputBase-input.Mui-disabled {
        color: black;
        -webkit-text-fill-color: black;
        font-size: 0.98rem;
    }
`;

type Props<T> = SelectProps<T> & {
    helperText?: string;
};

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

export const StyledSelectField = styled(FormControl)({
    '& .MuiInputBase-root': { backgroundColor: 'white' },
    'width': 'clamp(50%, 600px, 100%)',
});

export const StyledTextareaAutosize = styled(TextareaAutosize)`
    background-color: 'white';
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

export const StyledRow = styled('div')`
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 16px;

    @media only screen and (max-width: 700px) {
        flex-direction: column;
    }
`;

export const StyledForm = styled('div')`
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const StyledSection = styled('div')`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;
