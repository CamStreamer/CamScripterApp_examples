import { Control, Controller } from 'react-hook-form';
import { TServerData } from '../../../models/schema';
import { StyledTextField } from '../../../components/FormInputs';
import { InputAdornment } from '@mui/material';
import { parseValueAsInt } from '../../../utils';

type Props = {
    control: Control<TServerData>;
};

export const FormMsSharepoint = ({ control }: Props) => {
    return (
        <>
            <Controller
                name={'share_point.url'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        label="SharePoint url"
                        onChange={(e) => {
                            field.onChange(e.target.value);
                        }}
                        error={!!formState.errors.share_point?.url}
                        helperText={formState.errors.share_point?.url?.message}
                    />
                )}
            />
            <Controller
                name={'share_point.output_dir'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        label="SharePoint directory path"
                        onChange={(e) => {
                            field.onChange(e.target.value);
                        }}
                        error={!!formState.errors.share_point?.output_dir}
                        helperText={formState.errors.share_point?.output_dir?.message}
                    />
                )}
            />
            <Controller
                name={'share_point.client_secret'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        label="Client secret"
                        onChange={(e) => {
                            field.onChange(e.target.value);
                        }}
                        error={!!formState.errors.share_point?.client_secret}
                        helperText={formState.errors.share_point?.client_secret?.message}
                    />
                )}
            />
            <Controller
                name={'share_point.client_id'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        label="Client ID"
                        onChange={(e) => {
                            field.onChange(e.target.value);
                        }}
                        error={!!formState.errors.share_point?.client_id}
                        helperText={formState.errors.share_point?.client_id?.message}
                    />
                )}
            />
            <Controller
                name={'share_point.tenant_id'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        label="Tenant ID"
                        onChange={(e) => {
                            field.onChange(e.target.value);
                        }}
                        error={!!formState.errors.share_point?.tenant_id}
                        helperText={formState.errors.share_point?.tenant_id?.message}
                    />
                )}
            />
            <Controller
                name={'share_point.connection_timeout_s'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        defaultValue={field.value}
                        InputLabelProps={{ shrink: true }}
                        onBlur={(e) => {
                            const val = parseValueAsInt(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                            field.onBlur();
                        }}
                        label="Connection timeout"
                        error={!!formState.errors.share_point?.connection_timeout_s}
                        helperText={formState.errors.share_point?.connection_timeout_s?.message}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" disableTypography>
                                    s
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            />
            <Controller
                name={'share_point.upload_timeout_s'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        defaultValue={field.value}
                        InputLabelProps={{ shrink: true }}
                        onBlur={(e) => {
                            const val = parseValueAsInt(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                            field.onBlur();
                        }}
                        label="Upload timeout"
                        error={!!formState.errors.share_point?.upload_timeout_s}
                        helperText={formState.errors.share_point?.upload_timeout_s?.message}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" disableTypography>
                                    s
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            />
            <Controller
                name={'share_point.number_of_retries'}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        defaultValue={field.value}
                        InputLabelProps={{ shrink: true }}
                        onBlur={(e) => {
                            const val = parseValueAsInt(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                            field.onBlur();
                        }}
                        label="Number of retries"
                        error={!!formState.errors.share_point?.number_of_retries}
                        helperText={formState.errors.share_point?.number_of_retries?.message}
                    />
                )}
            />
        </>
    );
};
