import styled from '@emotion/styled';
import { Box } from '@mui/material';
import { parseValueAsFloat } from '../utils';
import { Title } from '../components/Title';
import { TServerData } from '../models/schema';
import { Control, Controller } from 'react-hook-form';
import { StyledTextField } from '../components/FormInputs';

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

/*
    <Title text="Specify the condition under which the event is to be emitted" />
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
                    const val = parseValueAsInt(e.target.value);
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
                    const val = parseValueAsInt(e.target.value);
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
                label="How long the condition has to last"
                InputLabelProps={{ shrink: true }}
                onBlur={(e) => {
                    const val = parseValueAsInt(e.target.value);
                    field.onChange(val);
                    e.target.value = val.toString();
                }}
                error={!!formState.errors.luxmeter?.period}
                helperText={formState.errors.luxmeter?.period?.message}
            />
        )}
    />
*/
