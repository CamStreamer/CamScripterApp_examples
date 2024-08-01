import styled from '@emotion/styled';
import { parseValueAsFloat } from '../utils';
import { Title } from '../components/Title';
import { TServerData } from '../models/schema';
import { Control, Controller } from 'react-hook-form';
import { StyledSelect, StyledTextField } from '../components/FormInputs';
import { Box, FormControlLabel, Switch, MenuItem } from '@mui/material';
import { PasswordInput } from '../components/PasswordInput';

type Props = {
    control: Control<TServerData>;
};

export const LuxMeterSettings = ({ control }: Props) => {
    return (
        <StyledForm>
            <StyledSection>
                <Title text="Select how often should luxmeter send results of measurement" />
                <Controller
                    name={'luxmeter.frequency'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            defaultValue={field.value}
                            fullWidth
                            label="Frequency"
                            InputLabelProps={{ shrink: true }}
                            onBlur={(e) => {
                                const val = parseValueAsFloat(e.target.value);
                                field.onChange(val);
                                e.target.value = val.toString();
                            }}
                            error={!!formState.errors.luxmeter?.frequency}
                            helperText={formState.errors.luxmeter?.frequency?.message}
                        />
                    )}
                />
            </StyledSection>

            <StyledSection>
                <Title text="Axis Events settings" />
                <Controller
                    name="events.enabled"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={field.value}
                                    onChange={(e, v) => {
                                        field.onChange(v);
                                    }}
                                />
                            }
                            label={'Active'}
                        />
                    )}
                />
                <Controller
                    name={'luxmeter.low'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            defaultValue={field.value}
                            fullWidth
                            label="Low level of intensity"
                            InputLabelProps={{ shrink: true }}
                            onBlur={(e) => {
                                const val = parseValueAsFloat(e.target.value);
                                field.onChange(val);
                                e.target.value = val.toString();
                            }}
                            error={!!formState.errors.luxmeter?.low}
                            helperText={formState.errors.luxmeter?.low?.message}
                        />
                    )}
                />
                <Controller
                    name={'luxmeter.high'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            defaultValue={field.value}
                            fullWidth
                            label="High level of intensity"
                            InputLabelProps={{ shrink: true }}
                            onBlur={(e) => {
                                const val = parseValueAsFloat(e.target.value);
                                field.onChange(val);
                                e.target.value = val.toString();
                            }}
                            error={!!formState.errors.luxmeter?.high}
                            helperText={formState.errors.luxmeter?.high?.message}
                        />
                    )}
                />
                <Controller
                    name={'luxmeter.period'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            defaultValue={field.value}
                            fullWidth
                            label="Period"
                            InputLabelProps={{ shrink: true }}
                            onBlur={(e) => {
                                const val = parseValueAsFloat(e.target.value);
                                field.onChange(val);
                                e.target.value = val.toString();
                            }}
                            error={!!formState.errors.luxmeter?.period}
                            helperText={formState.errors.luxmeter?.period?.message}
                        />
                    )}
                />
            </StyledSection>

            <StyledSection>
                <Title text="Axis Camera Station settings" />
                <Controller
                    name={'acs.enabled'}
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={field.value}
                                    onChange={(e, v) => {
                                        field.onChange(v);
                                    }}
                                />
                            }
                            label={'Active'}
                        />
                    )}
                />
                <Controller
                    name={'acs.protocol'}
                    control={control}
                    render={({ field }) => (
                        <StyledSelect
                            {...field}
                            onChange={(...e) => {
                                field.onChange(...e);
                            }}
                            label="Protocol"
                        >
                            {PROTOCOLS.map((value) => (
                                <MenuItem key={value} value={value}>
                                    {PROTOCOL_LABELS[value]}
                                </MenuItem>
                            ))}
                        </StyledSelect>
                    )}
                />
                <Controller
                    name={'acs.ip'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            {...field}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            label="IP address"
                            error={formState.errors.acs?.ip !== undefined}
                            helperText={formState.errors.acs?.ip?.message}
                        />
                    )}
                />
                <Controller
                    name={'acs.port'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            defaultValue={field.value}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            label="Port"
                            error={formState.errors.acs?.port !== undefined}
                            helperText={formState.errors.acs?.port?.message}
                        />
                    )}
                />
                <Controller
                    name={'acs.source_key'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            {...field}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            label="Source Key"
                            error={formState.errors.acs?.source_key !== undefined}
                            helperText={formState.errors.acs?.source_key?.message}
                        />
                    )}
                />
                <Controller
                    name={'acs.user'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            {...field}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            label="User"
                            error={formState.errors.acs?.user !== undefined}
                            helperText={formState.errors.acs?.user?.message}
                        />
                    )}
                />
                <PasswordInput control={control} name={'acs.pass'} />
            </StyledSection>
        </StyledForm>
    );
};

const StyledForm = styled(Box)({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
});

const StyledSection = styled(Box)`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 8px;
`;

const PROTOCOL_LABELS: Record<TServerData['cameras'][0]['protocol'], string> = {
    http: 'HTTP',
    https: 'HTTPS',
    https_insecure: 'HTTPS (insecure)',
};
const PROTOCOLS = Object.keys(PROTOCOL_LABELS) as TServerData['cameras'][0]['protocol'][];
