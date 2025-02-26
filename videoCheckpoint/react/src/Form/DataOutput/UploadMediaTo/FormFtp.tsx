import { Control, Controller } from 'react-hook-form';
import { TServerData } from '../../../models/schema';
import { parseValueAsInt } from '../../../utils';
import { OUTPUT_TYPES, OUTPUT_TYPES_LABELS } from '../../constants/constants';
import { FormHelperText, RadioGroup, Radio } from '@mui/material';
import { StyledTextField, StyledRadioControlLabel, StyledForm, StyledRow } from '../../../components/FormInputs';
import { PasswordInput } from '../../../components/PasswordInput';

type Props = {
    control: Control<TServerData>;
};

export const FormFtp = ({ control }: Props) => {
    return (
        <>
            <Controller
                name="ftp_server.type"
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        style={{ gridColumn: '2 span' }}
                        value={field.value}
                        onChange={(e) => field.onChange(e)}
                    >
                        {OUTPUT_TYPES.map((type) => (
                            <StyledRadioControlLabel
                                key={type}
                                value={type}
                                control={<Radio color="info" />}
                                label={OUTPUT_TYPES_LABELS[type]}
                            />
                        ))}
                    </RadioGroup>
                )}
            />
            <FormHelperText>Select file type as an output.</FormHelperText>

            <StyledRow>
                <StyledForm>
                    {/* ------IP ADDRESS------*/}
                    <Controller
                        name={`ftp_server.ip`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="IP address"
                                error={!!formState.errors.ftp_server?.ip}
                                helperText={formState.errors.ftp_server?.ip?.message}
                            />
                        )}
                    />
                    {/* ------PORT------*/}
                    <Controller
                        name={`ftp_server.port`}
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
                                error={!!formState.errors.ftp_server?.port}
                                helperText={formState.errors.ftp_server?.port?.message}
                            />
                        )}
                    />
                    {/* ------UPLOAD PATH------*/}
                    <Controller
                        name={`ftp_server.upload_path`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="Upload path"
                                error={!!formState.errors.ftp_server?.upload_path}
                                helperText={formState.errors.ftp_server?.upload_path?.message}
                            />
                        )}
                    />
                    <FormHelperText>
                        Specify the complete path e.g. ftp/&#123;user&#125;/&#123;folder&#125; or just
                        &#123;user&#125;/&#123;folder&#125;
                    </FormHelperText>
                </StyledForm>
                <StyledForm>
                    {/* ------USER------*/}
                    <Controller
                        name={`ftp_server.user`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="User"
                                error={!!formState.errors.ftp_server?.user}
                                helperText={formState.errors.ftp_server?.user?.message}
                            />
                        )}
                    />
                    {/* ------PASSWORD------*/}
                    <PasswordInput control={control} name={`ftp_server.pass`} areCredentialsValid={true} />
                </StyledForm>
            </StyledRow>
        </>
    );
};
