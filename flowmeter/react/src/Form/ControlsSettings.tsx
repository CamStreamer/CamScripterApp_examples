import { Modal } from '../components/Modal';
import Button from '@mui/material/Button/Button';
import styled from '@mui/material/styles/styled';
import { Box, Chip, InputAdornment, Typography } from '@mui/material';
import { useGetStatus } from '../hooks/useGetStatus';
import { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { StyledTextField } from '../components/FormInputs';
import { TSettingsSchema } from '../models/schema';
import { parseValueAsFloat } from '../utils';
import { useSnackbar } from '../hooks/useSnackbar';
import { InfoSnackbar } from '../components/Snackbar';
import { useFlowMeterControl } from '../hooks/useFlowMeterControl';

export const ControlsSettings = () => {
    const { control } = useFormContext<TSettingsSchema>();
    const { snackbarData, closeSnackbar } = useSnackbar();
    const {
        handleStart,
        handleStop,
        handleResetCounter,
        handleCalibrationStart,
        handleCalibrationCalibrate,
        isStarting,
        isStopping,
        isDisabled,
    } = useFlowMeterControl();

    const glassSize = useWatch({ name: 'widget.glass_size', control });
    const flowMeterStarted = useWatch({ name: 'started', control });

    const [openResetModal, setOpenResetModal] = useState(false);
    const [openCalibrateModal, setOpenCalibrateModal] = useState(false);

    const handleOpenCalibrationModal = async () => {
        setOpenCalibrateModal(true);
        await handleCalibrationStart();
    };

    const [shouldHideButton, getLabelText, getChipClass, getButtonText] = useGetStatus({
        started: flowMeterStarted,
        isStarting,
        isStopping,
    });

    return (
        <>
            <InfoSnackbar snackbarData={snackbarData} closeSnackbar={closeSnackbar} />
            <StyledBox>
                <Typography fontWeight={700}>State</Typography>
                <StyledConnectionChip color={getChipClass()} label={getLabelText()} />
                {shouldHideButton ? null : (
                    <Button
                        variant="outlined"
                        color={flowMeterStarted ? 'error' : 'success'}
                        onClick={async () => {
                            await (flowMeterStarted ? handleStop() : handleStart());
                        }}
                        disabled={isDisabled}
                    >
                        {getButtonText()}
                    </Button>
                )}
            </StyledBox>
            <StyledButtonRow>
                <Button variant="outlined" onClick={() => setOpenResetModal(true)}>
                    RESET COUNTER
                </Button>
                <Modal
                    title="Confirmation"
                    description="By continuing you will reset the counter. Do you really wish to continue?"
                    confirmText="CONFIRM"
                    open={openResetModal}
                    onClose={() => setOpenResetModal(false)}
                    onConfirm={handleResetCounter}
                />

                <Button variant="outlined" onClick={handleOpenCalibrationModal}>
                    CALIBRATE
                </Button>
                <Modal
                    title="Flow Meter Calibration"
                    description="Use the flow meter, fill in the volume in liters (e.g. 0.5) and click the calibrate button."
                    confirmText="CALIBRATE"
                    open={openCalibrateModal}
                    onClose={() => setOpenCalibrateModal(false)}
                    onConfirm={() => handleCalibrationCalibrate(glassSize)}
                >
                    <Controller
                        name={'widget.glass_size'}
                        control={control}
                        render={({ field, formState }) => (
                            <StyledTextField
                                {...field}
                                fullWidth
                                label="Glass size"
                                InputLabelProps={{ shrink: true }}
                                onBlur={(e) => {
                                    const val = parseValueAsFloat(e.target.value);
                                    field.onChange(val);
                                    e.target.value = val.toString();
                                }}
                                error={!!formState.errors.widget?.glass_size}
                                helperText={formState.errors.widget?.glass_size?.message}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end" disableTypography>
                                            liters
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        )}
                    />
                </Modal>
            </StyledButtonRow>
        </>
    );
};

const StyledBox = styled(Box)`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 10px 0;
`;

const StyledConnectionChip = styled(Chip)`
    cursor: default;
    margin-right: 10px;
`;

const StyledButtonRow = styled('div')`
    display: flex;
    gap: 8px;
    margin: 12px 0;
`;
