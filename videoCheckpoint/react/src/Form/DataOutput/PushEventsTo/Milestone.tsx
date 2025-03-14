import { Controller, useFormContext } from 'react-hook-form';
import { TServerData } from '../../../models/schema';
import { parseValueAsInt } from '../../../utils';
import { StyledTextField, StyledForm, StyledRow } from '../../../components/FormInputs';
import { FormHelperText, Link } from '@mui/material';

export const Milestone = () => {
    const { control } = useFormContext<TServerData>();

    return (
        <>
            <FormHelperText>
                Integration uses XProtect Transact. To set up your Milestone system to retrieve data from our script,
                follow this{' '}
                <Link href="https://camstreamer.com/milestone-transact-guide" target="_blank">
                    guide
                </Link>
                .
            </FormHelperText>
            <StyledRow>
                <StyledForm>
                    {/* ------TRANSACTION SOURCE NAME------*/}
                    <Controller
                        name={`milestone.transaction_source`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="Transaction source name"
                                error={!!formState.errors.milestone?.transaction_source}
                                helperText={formState.errors.milestone?.transaction_source?.message}
                            />
                        )}
                    />
                </StyledForm>
                <StyledForm>
                    {/* ------PORT------*/}
                    <Controller
                        name={`milestone.port`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                InputLabelProps={{ shrink: true }}
                                onBlur={(e) => {
                                    const val = parseValueAsInt(e.target.value);
                                    field.onChange(val);
                                    e.target.value = val.toString();
                                }}
                                fullWidth
                                label="Port"
                                error={!!formState.errors.milestone?.port}
                                helperText={formState.errors.milestone?.port?.message}
                            />
                        )}
                    />
                </StyledForm>
            </StyledRow>
        </>
    );
};
