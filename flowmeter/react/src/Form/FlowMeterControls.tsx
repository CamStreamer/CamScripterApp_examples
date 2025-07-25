import { Modal } from '../components/Modal';
import Button from '@mui/material/Button/Button';
import styled from '@mui/material/styles/styled';
import { InputAdornment, Typography } from '@mui/material';
import { useGetFlowMeterStatus } from '../hooks/useGetFlowMeterStatus';
import { useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { StyledBox, StyledChip, StyledTextField } from '../components/FormInputs';
import { TSettings } from '../models/schema';
import { parseValueAsFloat } from '../utils';
import { useSnackbar } from '../hooks/useSnackbar';
import { InfoSnackbar } from '../components/Snackbar';
import { useFlowMeterControl } from '../hooks/useFlowMeterControls';

export const FlowMeterControls = () => {
    const { control } = useFormContext<TSettings>();
    const { snackbarData, displaySnackbar, closeSnackbar } = useSnackbar();
    const {
        handleStart,
        handleStop,
        handleResetCounter,
        handleCalibrationStart,
        handleCalibrationCalibrate,
        isStarting,
        isStopping,
        started,
    } = useFlowMeterControl({ displaySnackbar });

    const glassSize = useWatch({ name: 'calibration_volume', control });

    const [openResetModal, setOpenResetModal] = useState(false);
    const [openCalibrateModal, setOpenCalibrateModal] = useState(false);

    const handleOpenCalibrationModal = async () => {
        setOpenCalibrateModal(true);
        await handleCalibrationStart();
    };

    const { getLabelText, getChipClass, getButtonText } = useGetFlowMeterStatus({
        started,
        isStarting,
        isStopping,
    });

    return (
        <>
            <InfoSnackbar snackbarData={snackbarData} closeSnackbar={closeSnackbar} />
            <StyledBox>
                <Typography fontWeight={700}>State</Typography>
                <StyledChip color={getChipClass()} label={getLabelText()} />
                {isStarting || isStopping ? null : (
                    <Button
                        variant="outlined"
                        color={started ? 'error' : 'success'}
                        onClick={async () => {
                            await (started ? handleStop() : handleStart());
                        }}
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
                        name={'calibration_volume'}
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
                                error={!!formState.errors.calibration_volume}
                                helperText={formState.errors.calibration_volume?.message}
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

const StyledButtonRow = styled('div')`
    display: flex;
    gap: 8px;
    margin: 12px 0;
`;
