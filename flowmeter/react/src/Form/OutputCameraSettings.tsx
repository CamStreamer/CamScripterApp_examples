import { Controller, useFormContext } from 'react-hook-form';
import { TSettings } from '../models/schema';
import { StyledTextField, StyledForm, StyledRadioControlLabel } from '../components/FormInputs';
import { FormInputWithDialog } from '../components/FormInputWithDialog';
import { PasswordInput } from '../components/PasswordInput';
import { parseValueAsInt } from '../utils';
import { TCameraListOption } from '../hooks/useCameraList';
import { useCredentialsValidate } from '../hooks/useCredentialsValidate';

import { Title } from '../components/Title';
import { ViewAreaPicker } from '../components/ViewAreaPicker';
import { ConnectionCheck } from '../components/ConnectionCheck';
import { Radio, RadioGroup } from '@mui/material';
import { PROTOCOL_LABELS, PROTOCOLS } from '../constants';

type Props = {
    viewAreaList: TCameraListOption[];
};

export const OutputCameraSettings = ({ viewAreaList }: Props) => {
    const { control, setValue } = useFormContext<TSettings>();
    const { areCredentialsValid, isFetching, isCameraResponding, check } = useCredentialsValidate();

    return (
        <StyledForm>
            <Title text="Connection settings" />

            {/* ------PROTOCOL------*/}
            <Controller
                name={`camera_protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        style={{ gridColumn: '2 span' }}
                        value={field.value}
                        onChange={(e) => {
                            const protocol = e.target.value;
                            setValue(`camera_port`, protocol === 'http' ? 80 : 443, {
                                shouldTouch: true,
                            });
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

            {/* ------IP ADDRESS------*/}
            <Controller
                name={`camera_ip`}
                control={control}
                render={({ field, formState }) => (
                    <FormInputWithDialog
                        {...field}
                        value={field.value}
                        error={!!formState.errors.camera_ip}
                        helperText={formState.errors.camera_ip?.message}
                    />
                )}
            />

            {/* ------PORT------*/}
            <Controller
                name={`camera_port`}
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
                        error={!!formState.errors.camera_port}
                        helperText={formState.errors.camera_port?.message}
                    />
                )}
            />

            {/* ------USER------*/}
            <Controller
                name={`camera_user`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="User"
                        error={!!formState.errors.camera_user}
                        helperText={formState.errors.camera_user?.message}
                    />
                )}
            />

            {/* ------PASSWORD------*/}
            <PasswordInput control={control} areCredentialsValid={areCredentialsValid} />

            {/* ------CONNECTION CHECK------*/}
            <ConnectionCheck
                isFetching={isFetching}
                isCameraResponding={isCameraResponding}
                areCredentialsValid={areCredentialsValid}
                check={check}
            />

            {/* ------VIEW AREAS------*/}
            <Controller
                name={`camera_list`}
                control={control}
                render={({ field, formState }) => (
                    <ViewAreaPicker
                        {...field}
                        viewAreaList={viewAreaList}
                        onChange={(data) => field.onChange(data)}
                        error={!!formState.errors.camera_list}
                        helperText={formState.errors.camera_list?.message}
                    />
                )}
            />
        </StyledForm>
    );
};
