import { FormControlLabel, FormHelperText, Switch } from '@mui/material';
import { Controller, useWatch, useFormContext } from 'react-hook-form';
import { TServerData } from '../../models/schema';
import { StyledTextField, StyledForm, StyledRow, StyledSection } from '../../components/FormInputs';
import { FormGoogleDrive } from './FormGoogleDrive';
import { FormFtp } from './FormFtp';
import { FormMsSharepoint } from './FormMsSharePoint';

export const UploadMediaTo = () => {
    const { control } = useFormContext<TServerData>();
    const googleDriveEnabled = useWatch({ control, name: 'google_drive.enabled' });
    const msSharepointEnabled = useWatch({ control, name: 'share_point.enabled' });
    const ftpEnabled = useWatch({ control, name: 'ftp_server.enabled' });

    return (
        <StyledSection>
            <StyledRow>
                <StyledForm>
                    <StyledTextField
                        fullWidth
                        label="File name"
                        value="YYYY-MM-DD_HH-MM-SS_code_cameraSerialNumber_channelNumber"
                        disabled
                    />
                    <FormHelperText>
                        Example of final name of file is 2024-03-18_16-23-45_093155171251_B8A44F73E891_camera1.jpg
                    </FormHelperText>
                </StyledForm>
                <StyledForm />
            </StyledRow>
            <Controller
                name="google_drive.enabled"
                control={control}
                render={({ field }) => (
                    <FormControlLabel
                        control={
                            <Switch
                                {...field}
                                checked={field.value}
                                onChange={(e, v) => {
                                    field.onChange(v);
                                }}
                            />
                        }
                        label={'Google Drive'}
                    />
                )}
            />
            {googleDriveEnabled && <FormGoogleDrive control={control} />}
            <Controller
                name="ftp_server.enabled"
                control={control}
                render={({ field }) => (
                    <FormControlLabel
                        control={
                            <Switch
                                {...field}
                                checked={field.value}
                                onChange={(e, v) => {
                                    field.onChange(v);
                                }}
                            />
                        }
                        label={'FTP'}
                    />
                )}
            />
            {ftpEnabled && <FormFtp control={control} />}
            <Controller
                name="share_point.enabled"
                control={control}
                render={({ field }) => (
                    <FormControlLabel
                        control={
                            <Switch
                                disabled
                                {...field}
                                checked={field.value}
                                onChange={(e, v) => {
                                    field.onChange(v);
                                }}
                            />
                        }
                        label={'MS Sharepoint'}
                    />
                )}
            />
            {msSharepointEnabled && <FormMsSharepoint control={control} />}
            <FormControlLabel control={<Switch disabled />} label={'Dropbox'} />
            <FormControlLabel control={<Switch disabled />} label={'HTTPS'} />
        </StyledSection>
    );
};
