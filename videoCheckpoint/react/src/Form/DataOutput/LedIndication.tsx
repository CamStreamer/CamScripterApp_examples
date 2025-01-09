import { FormControlLabel, FormHelperText, Switch } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { TServerData } from '../../models/schema';
import { StyledTextField, StyledForm, StyledRow } from '../../components/FormInputs';
import { parseValueAsInt } from '../../utils';

export const LedIndication = () => {
    const { control } = useFormContext<TServerData>();

    return (
        <StyledForm>
            {/* ------LED ACTIVE------*/}
            <FormHelperText>
                When the script starts successfully (either after the device is connected or after saving settings),
                both LEDs flash alternately three times. A successful code reading is indicated by one green LED flash,
                while a failed code reading (due to a regex check failure) is shown by one red LED flash. A successful
                file upload is indicated by two green LED flashes, while a failed upload is shown by two red LED
                flashes.
            </FormHelperText>
            <Controller
                name="led.enabled"
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
            <StyledRow>
                <StyledForm>
                    {/* ------LED SUCCESS------*/}
                    <Controller
                        name="led.led_green_port"
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                defaultValue={field.value}
                                InputLabelProps={{ shrink: true }}
                                onBlur={(e) => {
                                    const val = parseValueAsInt(e.target.value);
                                    field.onChange(val);
                                    e.target.value = val.toString();
                                }}
                                fullWidth
                                label="Success LED indication port"
                                error={!!formState.errors.led?.led_green_port}
                                helperText={formState.errors.led?.led_green_port?.message}
                            />
                        )}
                    />
                    <FormHelperText>Device I/O port number.</FormHelperText>
                </StyledForm>
                <StyledForm>
                    {/* ------LED ERROR------*/}
                    <Controller
                        name="led.led_red_port"
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                defaultValue={field.value}
                                InputLabelProps={{ shrink: true }}
                                onBlur={(e) => {
                                    const val = parseValueAsInt(e.target.value);
                                    field.onChange(val);
                                    e.target.value = val.toString();
                                }}
                                fullWidth
                                label="Error LED indication port"
                                error={!!formState.errors.led?.led_red_port}
                                helperText={formState.errors.led?.led_red_port?.message}
                            />
                        )}
                    />
                    <FormHelperText>Device I/O port number.</FormHelperText>
                </StyledForm>
            </StyledRow>
        </StyledForm>
    );
};
