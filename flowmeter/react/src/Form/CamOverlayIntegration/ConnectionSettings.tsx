import { Controller, useFormContext } from 'react-hook-form';
import { TSettingsSchema } from '../../models/schema';
import { Radio, RadioGroup } from '@mui/material';
import { StyledTextField, StyledRadioControlLabel, StyledForm } from '../../components/FormInputs';
import { FormInputWithDialog } from '../../components/FormInputWithDialog';
import { PasswordInput } from '../../components/PasswordInput';
import { ConnectionCheck } from '../../components/ConnectionCheck';
import { ViewAreaPicker } from '../../components/ViewAreaPicker';
import { parseValueAsInt } from '../../utils';
import { TCameraListOption } from '../../hooks/useCameraList';
import { useCredentialsValidate } from '../../hooks/useCredentialsValidate';
import { PROTOCOLS, PROTOCOL_LABELS } from '../constants/constants';
import { Title } from '../../components/Title';

type Props = {
    viewAreaList: TCameraListOption[];
};

export const ConnectionSettings = ({ viewAreaList }: Props) => {
    const { control, setValue } = useFormContext<TSettingsSchema>();
    const [areCredentialsValid, isFetching, isCameraResponding, check] = useCredentialsValidate();

    return (
        <StyledForm>
            <Title text="Connection settings" />

            {/* ------PROTOCOL------*/}
            <Controller
                name={`camera.protocol`}
                control={control}
                render={({ field }) => (
                    <RadioGroup
                        row
                        style={{ gridColumn: '2 span' }}
                        value={field.value}
                        onChange={(e) => {
                            const protocol = e.target.value;
                            setValue(`camera.port`, protocol === 'http' ? 80 : 443, {
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
                name={`camera.ip`}
                control={control}
                render={({ field, formState }) => (
                    <FormInputWithDialog
                        {...field}
                        value={field.value}
                        error={!!formState.errors.camera?.ip}
                        helperText={formState.errors.camera?.ip?.message}
                    />
                )}
            />

            {/* ------PORT------*/}
            <Controller
                name={`camera.port`}
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
                        error={!!formState.errors.camera?.port}
                        helperText={formState.errors.camera?.port?.message}
                    />
                )}
            />

            {/* ------USER------*/}
            <Controller
                name={`camera.user`}
                control={control}
                render={({ field, formState }) => (
                    <StyledTextField
                        {...field}
                        fullWidth
                        label="User"
                        error={!!formState.errors.camera?.user}
                        helperText={formState.errors.camera?.user?.message}
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
