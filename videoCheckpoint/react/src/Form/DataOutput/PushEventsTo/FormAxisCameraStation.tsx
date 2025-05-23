import { Controller, useFormContext } from 'react-hook-form';
import { TServerData } from '../../../models/schema';
import { parseValueAsInt } from '../../../utils';
import { PROTOCOLS, PROTOCOL_LABELS } from '../../constants/constants';
import { StyledTextField, StyledRadioControlLabel, StyledForm, StyledRow } from '../../../components/FormInputs';
import { PasswordInput } from '../../../components/PasswordInput';
import { FormHelperText, Radio, RadioGroup, Link } from '@mui/material';

export const FormAxisCameraStation = () => {
    const { control } = useFormContext<TServerData>();

    return (
        <>
            <FormHelperText>
                To run external data on the Axis Camera Station (ACS), you need to edit the registry on the computer
                where ACS is installed using{' '}
                <Link href="https://camstreamer.com/acssettings" target="_blank">
                    this
                </Link>{' '}
                guide (or use the provided{' '}
                <Link href="https://camstreamer.com/acsregistery" target="_blank">
                    file
                </Link>
                ). Then, create a new source in Devices &#62; External data sources. Use the generated Source key in the
                settings below. To search for external data in ACS, click the + button, select &#39;Data search&#39;,
                and set the first filter to the value &#39;Live&#39;.
            </FormHelperText>
            {/* ------PROTOCOL------*/}
            <Controller
                name={`acs.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        style={{ gridColumn: '2 span' }}
                        value={field.value}
                        onChange={(e) => {
                            field.onChange(e);
                        }}
                    >
                        {PROTOCOLS.map((protocol) => (
                            <StyledRadioControlLabel
                                key={protocol}
                                value={protocol}
                                control={<Radio color="info" />}
                                label={PROTOCOL_LABELS[protocol]}
                            />
                        ))}
                    </RadioGroup>
                )}
            />
            <StyledRow>
                <StyledForm>
                    {/* ------IP ADDRESS------*/}
                    <Controller
                        name={`acs.ip`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="IP address"
                                error={!!formState.errors.acs?.ip}
                                helperText={formState.errors.acs?.ip?.message}
                            />
                        )}
                    />
                    {/* ------PORT------*/}
                    <Controller
                        name={`acs.port`}
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
                                error={!!formState.errors.acs?.port}
                                helperText={formState.errors.acs?.port?.message}
                            />
                        )}
                    />
                    <FormHelperText>Default ports are 29204 or 55756.</FormHelperText>
                </StyledForm>
                <StyledForm>
                    {/* ------USER------*/}
                    <Controller
                        name={`acs.user`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="User"
                                error={!!formState.errors.acs?.user}
                                helperText={formState.errors.acs?.user?.message}
                            />
                        )}
                    />
                    {/* ------PASSWORD------*/}
                    <PasswordInput control={control} name={`acs.pass`} areCredentialsValid={true} />
                </StyledForm>
            </StyledRow>
            <StyledRow>
                <StyledForm>
                    <Controller
                        name="acs.source_key"
                        control={control}
                        render={({ field }) => <StyledTextField {...field} fullWidth label="Source key" />}
                    />
                </StyledForm>
                <StyledForm />
            </StyledRow>
        </>
    );
};
