import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField, StyledRadioGroup, StyledRadioControlLabel } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import { Stack, Radio } from '@mui/material';
import { FormInputWithDialog } from '../../components/FormInputWithDialog';
import { PasswordInput } from '../../components/PasswordInput';
import { ViewAreaPicker } from '../../components/VIewAreaPicker';
import { TCameraListOption } from '../../hooks/useCameraList';
import { TAppSchema } from '../../models/schema';
import { PROTOCOLS, PROTOCOL_LABELS } from '../constants';

type Props = {
    viewAreaList: TCameraListOption[];
};

export const IntegrationCameraSettings = ({ viewAreaList }: Props) => {
    const { control, setValue } = useFormContext<TAppSchema>();

    return (
        <Stack spacing={1.5}>
            <Title text="Camera Settings" />
            {/*------PROTOCOL------*/}
            <Controller
                name={`camera_protocol`}
                control={control}
                render={({ field }) => (
                    <StyledRadioGroup
                        row
                        value={field.value}
                        onChange={(event) => {
                            const protocol = event.target.value;
                            setValue(`camera_port`, protocol === 'http' ? 80 : 443, {
                                shouldTouch: true,
                            });

                            field.onChange(event);
                        }}
                    >
                        {PROTOCOLS.map((value) => (
                            <StyledRadioControlLabel
                                key={value}
                                value={value}
                                control={<Radio />}
                                label={PROTOCOL_LABELS[value]}
                            />
                        ))}
                    </StyledRadioGroup>
                )}
            />
            {/*------IP ADDRESS------*/}
            <Controller
                name={`camera_ip`}
                control={control}
                render={({ field, formState }) => (
                    <FormInputWithDialog
                        {...field}
                        value={field.value}
                        keyName="camera_ip"
                        error={!!formState.errors.camera_ip}
                        helperText={formState.errors.camera_ip?.message}
                    />
                )}
            />
            {/*------PORT------*/}
            <Controller
                name={`camera_port`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        label="Port"
                        onChange={(e) => {
                            const val = parseValueAsInt(e.target.value);
                            field.onChange(val);
                            e.target.value = val.toString();
                            field.onBlur();
                        }}
                        error={formState.errors.camera_port !== undefined}
                        helperText={formState.errors.camera_port?.message}
                    />
                )}
            />
            {/*------USER------*/}
            <Controller
                name={`camera_user`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="User"
                        error={formState.errors.camera_user !== undefined}
                        helperText={formState.errors.camera_user?.message}
                        onBlur={() => {
                            field.onBlur();
                        }}
                    />
                )}
            />
            {/*------PASSWORD------*/}
            <PasswordInput name="camera_pass" areCredentialsValid={true} control={control} />
            {/*------VIEW AREA(S)------*/}
            <Controller
                name={`view_areas`}
                control={control}
                render={({ field, formState }) => (
                    <ViewAreaPicker
                        {...field}
                        viewAreaList={viewAreaList}
                        onChange={(data) => field.onChange(data)}
                        error={!!formState.errors.event_view_areas}
                        helperText={formState.errors.event_view_areas?.message}
                    />
                )}
            />
        </Stack>
    );
};
