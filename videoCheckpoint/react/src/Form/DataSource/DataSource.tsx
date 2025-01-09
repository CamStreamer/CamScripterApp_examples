import { FormHelperText, Typography } from '@mui/material';
import { CollapsibleFormSection } from '../../components/CollapsibleFormSection';
import { StyledForm } from '../../components/FormInputs';
import { FormConnectParams } from '../FormConnectParams';
import { ValidationRule } from './ValidationRule';

export const DataSource = () => {
    return (
        <StyledForm>
            <CollapsibleFormSection label="Source of barcode/qr code" defaultExpanded={true}>
                <StyledForm>
                    <FormHelperText>
                        Before connecting the barcode/QR code reader, ensure that the reader is set to use US English as
                        the language and inserts an ENTER after each reading (referred to as CR/LF in programming
                        manuals). The programming manuals are available in PDF format and contain programming codes that
                        can be scanned directly with the reader. These manuals can usually be easily found online by
                        searching for the reader&#39;s model.
                    </FormHelperText>
                    <Typography>Source: USB port</Typography>
                    <FormConnectParams name={'conn_hub'} />
                    <ValidationRule />
                </StyledForm>
            </CollapsibleFormSection>

            <CollapsibleFormSection label="Source device of images/video" defaultExpanded={true}>
                <StyledForm>
                    <FormHelperText>
                        To upload video files, be sure to enable continuous recording on the camera in the live view
                        under Video &#62; Overlays.
                    </FormHelperText>
                    <FormConnectParams name={'camera'} />
                </StyledForm>
            </CollapsibleFormSection>
        </StyledForm>
    );
};
