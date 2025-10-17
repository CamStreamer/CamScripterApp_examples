import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { TServerData } from '../../../models/schema';
import { parseValueAsInt } from '../../../utils';
import { useGenetecConnection } from '../../../hooks/useGenetecConnection';
import { PROTOCOLS, PROTOCOL_LABELS } from '../../constants/constants';
import { StyledTextField, StyledRadioControlLabel, StyledForm, StyledRow } from '../../../components/FormInputs';
import { PasswordInput } from '../../../components/PasswordInput';
import { ConnectionCheck } from '../../../components/ConnectionCheck';
import { MultiSelectWithSearch } from '../../../components/MultiSelectWithSearch';
import { InfoSnackbar } from '../../../components/Snackbar';
import { useSnackbar } from '../../../hooks/useSnackbar';
import {
    FormHelperText,
    Radio,
    RadioGroup,
    Link,
    Button,
    Box,
    Typography,
    FormControlLabel,
    Switch,
} from '@mui/material';
import styled from '@mui/material/styles/styled';

export const Genetec = () => {
    const { control } = useFormContext<TServerData>();
    const { snackbarData, displaySnackbar, closeSnackbar } = useSnackbar();
    const [
        handleCheckConnection,
        handleSendTestBookmark,
        handleFetchCameraList,
        isConnected,
        isFetching,
        cameraList,
        serverRunning,
        isDisabled,
    ] = useGenetecConnection({
        displaySnackbar,
    });

    const isAppIdDisabled = useWatch({ control, name: 'genetec.app_id_enabled' });
    const selectedCameraList = useWatch({ control, name: 'genetec.camera_list' });
    const isSendDisabled =
        !isConnected || cameraList?.length === 0 || selectedCameraList.length === 0 || !serverRunning || isDisabled;

    return (
        <>
            <InfoSnackbar snackbarData={snackbarData} closeSnackbar={closeSnackbar} />
            <FormHelperText>
                To connect with <StyledBoldText>Genetec Security Center</StyledBoldText>, purchase one{' '}
                <StyledBoldText>CamStreamer Connector (GSC-1SDK-CAMSTREAMER-CONNECTOR)</StyledBoldText> license from
                your <StyledBoldText>Genetec Vendor</StyledBoldText> and activate it via{' '}
                <StyledBoldText>Genetec Server Admin</StyledBoldText> at{' '}
                <Link href="http://localhost/Genetec/" target="_blank">
                    http://localhost/Genetec/
                </Link>
                . Use the <StyledBoldText>Bookmarks</StyledBoldText> module in Security Center to view the created
                bookmarks. More information on using the Bookmarks module can be found{' '}
                <Link href="https://camstreamer.com/genetec-bookmarks" target="_blank">
                    here
                </Link>
                .
                <FormHelperText>
                    If you wish to use a <StyledBoldText>development license</StyledBoldText>, activate the{' '}
                    <StyledBoldText>Development Application ID</StyledBoldText> and enter the identifier of your
                    development application.
                </FormHelperText>
            </FormHelperText>
            {/* ------PROTOCOL------*/}
            <Controller
                name={`genetec.protocol`}
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
                        name={`genetec.ip`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="IP address/host name"
                                error={!!formState.errors.genetec?.ip}
                                helperText={formState.errors.genetec?.ip?.message}
                            />
                        )}
                    />
                    {/* ------PORT------*/}
                    <Controller
                        name={`genetec.port`}
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
                                error={!!formState.errors.genetec?.port}
                                helperText={formState.errors.genetec?.port?.message}
                            />
                        )}
                    />
                    {/* ------BASE URI------*/}
                    <Controller
                        name="genetec.base_uri"
                        control={control}
                        render={({ field }) => <StyledTextField {...field} fullWidth label="Base Uri" />}
                    />
                    <Controller
                        name="genetec.app_id_enabled"
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
                                label={'Enable Development Application ID'}
                            />
                        )}
                    />
                    {/* ------APPLICATION ID------*/}
                    <Controller
                        name="genetec.app_id"
                        control={control}
                        render={({ field }) => (
                            <StyledTextField
                                {...field}
                                disabled={!isAppIdDisabled}
                                fullWidth
                                label="Development Application ID"
                            />
                        )}
                    />
                </StyledForm>
                <StyledForm>
                    {/* ------USER------*/}
                    <Controller
                        name={`genetec.user`}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="User"
                                error={!!formState.errors.genetec?.user}
                                helperText={formState.errors.genetec?.user?.message}
                            />
                        )}
                    />
                    {/* ------PASSWORD------*/}
                    <PasswordInput control={control} name={`genetec.pass`} areCredentialsValid={true} />
                    {/* ------BOOKMARK CAMERA(S)------*/}
                    <Controller
                        name={`genetec.camera_list`}
                        control={control}
                        render={({ field, formState }) => (
                            <MultiSelectWithSearch
                                {...field}
                                cameraList={cameraList}
                                onChange={(data) => field.onChange(data)}
                                reloadCameras={handleFetchCameraList}
                                disabled={!isConnected || isDisabled}
                                error={!!formState.errors.genetec?.camera_list}
                                helperText={formState.errors.genetec?.camera_list?.message}
                            />
                        )}
                    />
                </StyledForm>
            </StyledRow>
            {/* ------CONNECTION CHECK------*/}
            <ConnectionCheck
                isFetching={isFetching}
                isCameraResponding={isConnected}
                areCredentialsValid={true}
                name={'genetec'}
                check={handleCheckConnection}
            />
            {/* ------SEND TEST MESSAGE------*/}
            <StyledForm>
                <StyledBox>
                    <Typography fontWeight={700}>Test message</Typography>
                    <Button variant="outlined" onClick={handleSendTestBookmark} disabled={isSendDisabled}>
                        Send
                    </Button>
                </StyledBox>
                <FormHelperText>
                    This button will send a bookmark with the current time and the message &#39;Testing bookmark from
                    CamStreamer script&#39;.
                </FormHelperText>
            </StyledForm>
        </>
    );
};

const StyledBox = styled(Box)`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 10px 0;
`;

const StyledBoldText = styled('span')`
    font-weight: bold;
`;
