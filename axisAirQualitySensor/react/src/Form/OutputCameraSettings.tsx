import { Controller, useFormContext } from 'react-hook-form';
import { TServerData } from '../models/schema';
import { Radio, RadioGroup } from '@mui/material';
import { StyledTextField, StyledRadioControlLabel, StyledForm } from '../components/FormInputs';
import { FormInputWithDialog } from '../components/FormInputWithDialog';
import { PasswordInput } from '../components/PasswordInput';
import { ConnectionCheck } from '../components/ConnectionCheck';
import { ViewAreaPicker } from '../components/ViewAreaPicker';
import { parseValueAsInt } from '../utils';
import { TCameraListOption } from '../hooks/useCameraList';
import { useCredentialsValidate } from '../hooks/useCredentialsValidate';
import { PROTOCOLS, PROTOCOL_LABELS } from './constants/constants';
import { Title } from '../components/Title';

type Props = {
    viewAreaList: TCameraListOption[];
};

export const OutputCameraSettings = ({ viewAreaList }: Props) => {
    const { control, setValue } = useFormContext<TServerData>();
    const [areCredentialsValid, isFetching, isCameraResponding, check] = useCredentialsValidate({
        name: 'output_camera',
    });

    return (
        <StyledForm>
            <Title text="Connection settings" />

            {/* ------PROTOCOL------*/}
            <Controller
                name={`output_camera.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        style={{ gridColumn: '2 span' }}
                        value={field.value}
                        onChange={(e) => {
                            const protocol = e.target.value;
                            setValue(`output_camera.port`, protocol === 'http' ? 80 : 443, {
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
                name={`output_camera.ip`}
                control={control}
                render={({ field, formState }) => (
                    <FormInputWithDialog
                        {...field}
                        value={field.value}
                        error={!!formState.errors.output_camera?.ip}
                        helperText={formState.errors.output_camera?.ip?.message}
                    />
                )}
            />

            {/* ------PORT------*/}
            <Controller
                name={`output_camera.port`}
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
                        error={!!formState.errors.output_camera?.port}
                        helperText={formState.errors.output_camera?.port?.message}
                    />
                )}
            />

            {/* ------USER------*/}
            <Controller
                name={`output_camera.user`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="User"
                        error={!!formState.errors.output_camera?.user}
                        helperText={formState.errors.output_camera?.user?.message}
                    />
                )}
            />

            {/* ------PASSWORD------*/}
            <PasswordInput control={control} name={`output_camera.pass`} areCredentialsValid={areCredentialsValid} />

            {/* ------CONNECTION CHECK------*/}
            <ConnectionCheck
                isFetching={isFetching}
                isCameraResponding={isCameraResponding}
                areCredentialsValid={areCredentialsValid}
                name="output_camera"
                check={check}
            />

            {/* ------VIEW AREAS------*/}
            <Controller
                name={`widget.camera_list`}
                control={control}
                render={({ field, formState }) => (
                    <ViewAreaPicker
                        {...field}
                        viewAreaList={viewAreaList}
                        onChange={(data) => field.onChange(data)}
                        error={!!formState.errors.widget?.camera_list}
                        helperText={formState.errors.widget?.camera_list?.message}
                    />
                )}
            />
        </StyledForm>
    );
};
