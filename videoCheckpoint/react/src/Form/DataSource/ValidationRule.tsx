import { FormHelperText, Link, Stack } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { Title } from '../../components/Title';
import { StyledTextField, StyledForm, StyledRow } from '../../components/FormInputs';

export const ValidationRule = () => {
    const { control } = useFormContext();

    return (
        <StyledRow>
            <StyledForm>
                <Stack spacing={1.5}>
                    <Title text="Validation rule" />
                    <Controller
                        name={`barcode_validation_rule`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                label="E.g. ([A-Z])\w+"
                                error={!!formState.errors.barcode_validation_rule}
                                helperText={formState.errors.barcode_validation_rule?.message?.toString()}
                            />
                        )}
                    />
                    <FormHelperText>
                        Use regular expressions - documentation{' '}
                        <Link href="https://camstreamer.com/regex" target="_blank">
                            here
                        </Link>
                        . Matching data will be processed.
                    </FormHelperText>
                </Stack>
            </StyledForm>
            <StyledForm />
        </StyledRow>
    );
};
