import styled from '@mui/material/styles/styled';
import { Control, Controller } from 'react-hook-form';
import { TServerData } from '../../models/schema';
import { OUTPUT_TYPES, OUTPUT_TYPES_LABELS } from '../constants/constants';
import { FormHelperText, Link, RadioGroup, Radio } from '@mui/material';
import { StyledRadioControlLabel, StyledTextField, StyledForm, StyledRow } from '../../components/FormInputs';

type Props = {
    control: Control<TServerData>;
};

export const FormGoogleDrive = ({ control }: Props) => {
    return (
        <>
            <Controller
                name="google_drive.type"
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
                    <FormHelperText>
                        Enable Google Drive API{' '}
                        <Link href="https://console.cloud.google.com/apis/api/" target="_blank">
                            here
                        </Link>{' '}
                        (if not available, select it from the Library). Create a service account{' '}
                        <Link href="https://console.cloud.google.com/apis/credentials" target="_blank">
                            here
                        </Link>{' '}
                        via CREATE CREDENTIALS button. If you don&#39;t have a project, create a new one. Click on the
                        created service account, and go to the Keys section. Add a new key, choose type JSON, and hit
                        the Create button, the JSON file will start downloading. Open the file via any text editor, find
                        the Private key and Client email values in the quotes, and copy them into the following fields.
                    </FormHelperText>
                    {/* ------PRIVATE KEY------*/}
                    <Controller
                        name="google_drive.private_key"
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                label="Private key"
                                minRows={5}
                                maxRows={5}
                                multiline
                                error={!!formState.errors.barcode_validation_rule}
                                helperText={formState.errors.barcode_validation_rule?.message}
                            />
                        )}
                    />
                    {/* ------CLIENT EMAIL------*/}
                    <Controller
                        name={'google_drive.email'}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                label="Client email"
                                error={!!formState.errors.google_drive?.email}
                                helperText={formState.errors.google_drive?.email?.message}
                            />
                        )}
                    />
                </StyledForm>
                <StyledForm>
                    <FormHelperText>
                        Create a folder in your Google Drive, share this folder with user email from the field{' '}
                        <StyledBoldText>Client email</StyledBoldText>, and copy the shared link into the following
                        field.
                    </FormHelperText>
                    {/* ------LINK TO SHARED FOLDER------*/}
                    <Controller
                        name={'google_drive.folder_id'}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                label="Link to shared folder"
                                onBlur={() => {
                                    field.onBlur();
                                    try {
                                        const url = new URL(field.value);
                                        const parts = url.pathname.split('/');
                                        const folderId = parts[parts.length - 1];
                                        field.onChange(folderId);
                                    } catch {
                                        // Probably folder id
                                    }
                                }}
                                error={!!formState.errors.google_drive?.folder_id}
                                helperText={formState.errors.google_drive?.folder_id?.message}
                            />
                        )}
                    />
                </StyledForm>
            </StyledRow>
        </>
    );
};

const StyledBoldText = styled('span')`
    font-weight: bold;
`;
