import { parseValueAsInt } from '../../utils';
import { Controller, useFormContext } from 'react-hook-form';
import { StyledTextField } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import { Stack, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { FormInputWithDialog } from '../../components/FormInputWithDialog';
import { PasswordInput } from '../../components/PasswordInput';
import { ViewAreaPicker } from '../../components/VIewAreaPicker';
import { TCameraListOption } from '../../hooks/useCameraList';
import { TAppSchema } from '../../models/schema';
import { PROTOCOLS, PROTOCOL_LABELS } from '../constants';

type Props = {
    viewAreaList: TCameraListOption[];
};

export const EventsCameraSettings = ({ viewAreaList }: Props) => {
    const { control, setValue } = useFormContext<TAppSchema>();

    return (
        <Stack spacing={1.5}>
            <Title text="Camera Settings" />
            {/*------PROTOCOL------*/}
            <Controller
                name={`event_camera_protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        defaultValue={field.value}
                        onChange={(event) => {
                            const protocol = event.target.value;
                            setValue(`event_camera_port`, protocol === 'http' ? 80 : 443, {
                                shouldTouch: true,
                            });

                            field.onChange(event);
                        }}
                    >
                        {PROTOCOLS.map((value) => (
                            <FormControlLabel
                                key={value}
                                value={value}
                                control={<Radio />}
                                label={PROTOCOL_LABELS[value]}
                            />
                        ))}
                    </RadioGroup>
                )}
            />
            {/*------IP ADDRESS------*/}
            <Controller
                name={`event_camera_ip`}
                control={control}
                render={({ field }) => <FormInputWithDialog {...field} value={field.value} keyName="event_camera_ip" />}
            />
            {/*------PORT------*/}
            <Controller
                name={`event_camera_port`}
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
                        error={formState.errors.event_camera_port !== undefined}
                        helperText={formState.errors.event_camera_port?.message}
                    />
                )}
            />
            {/*------USER------*/}
            <Controller
                name={`event_camera_user`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="User"
                        error={formState.errors.event_camera_user !== undefined}
                        helperText={formState.errors.event_camera_user?.message}
                        onBlur={() => {
                            field.onBlur();
                        }}
                    />
                )}
            />
            {/*------PASSWORD------*/}
            <PasswordInput name="event_camera_pass" areCredentialsValid={true} control={control} />
            {/*------VIEW AREA(S)------*/}
            <Controller
                name={`event_view_areas`}
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
