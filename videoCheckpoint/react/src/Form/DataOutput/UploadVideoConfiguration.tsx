import styled from '@mui/material/styles/styled';
import { FormControlLabel, FormHelperText, InputAdornment, Stack, Switch } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { TServerData } from '../../models/schema';
import { StyledTextField, StyledRow, StyledForm } from '../../components/FormInputs';
import { Title } from '../../components/Title';
import { ViewAreaPicker } from '../../components/ViewAreaPicker';
import { parseValueAsInt } from '../../utils';
import { TCameraListOption } from '../../hooks/useCameraList';

type Props = {
    viewAreaList: TCameraListOption[];
};

export const UploadVideoConfiguration = ({ viewAreaList }: Props) => {
    const { control } = useFormContext<TServerData>();

    return (
        <Stack spacing={1.5}>
            <FormHelperText>
                The script starts and stops recording by repeatedly scanning the same code. If a start or stop code is
                active, only defined codes can start or stop recording.{' '}
            </FormHelperText>
            <StyledRow>
                <StyledForm>
                    <Controller
                        name="video_upload.camera_list"
                        control={control}
                        render={({ field, formState }) => (
                            <ViewAreaPicker
                                {...field}
                                viewAreaList={viewAreaList}
                                onChange={(data) => field.onChange(data)}
                                error={!!formState.errors.video_upload?.camera_list}
                                helperText={formState.errors.video_upload?.camera_list?.message}
                            />
                        )}
                    />
                </StyledForm>
                <StyledForm />
            </StyledRow>
            <StyledGrid $numberOfColumns={3} $labelColumnSpan={1} $gridAutoFlow="row">
                <Controller
                    name="video_upload.timeout_enabled"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={field.value}
                                    onChange={(e, v) => {
                                        field.onChange(v);
                                    }}
                                />
                            }
                            label="Timeout"
                        />
                    )}
                />
                <Controller
                    name="video_upload.starting_barcode_enabled"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={field.value}
                                    onChange={(e, v) => {
                                        field.onChange(v);
                                    }}
                                />
                            }
                            label="Start code"
                        />
                    )}
                />
                <Controller
                    name="video_upload.closing_barcode_enabled"
                    control={control}
                    render={({ field }) => (
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={field.value}
                                    onChange={(e, v) => {
                                        field.onChange(v);
                                    }}
                                />
                            }
                            label="Stop code"
                        />
                    )}
                />

                <Controller
                    name={'video_upload.timeout_sec'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            defaultValue={field.value}
                            InputLabelProps={{ shrink: true }}
                            onBlur={(e) => {
                                const val = parseValueAsInt(e.target.value);
                                field.onChange(val);
                                e.target.value = val.toString();
                            }}
                            fullWidth
                            label="Timeout"
                            error={!!formState.errors.video_upload?.timeout_sec}
                            helperText={formState.errors.video_upload?.timeout_sec?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        seconds
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />
                <Controller
                    name={'video_upload.starting_barcode'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            {...field}
                            label="Start code"
                            placeholder="e.g. 1234567890123"
                            error={!!formState.errors.video_upload?.starting_barcode}
                            helperText={formState.errors.video_upload?.starting_barcode?.message}
                        />
                    )}
                />
                <Controller
                    name={'video_upload.closing_barcode'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            {...field}
                            label="Stop code"
                            placeholder="e.g. 1234567890123"
                            error={!!formState.errors.video_upload?.closing_barcode}
                            helperText={formState.errors.video_upload?.closing_barcode?.message}
                        />
                    )}
                />
            </StyledGrid>
            <Title text="Pre & Post video upload buffers" />
            <StyledRow>
                <Controller
                    name={'video_upload.prebuffer_sec'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            defaultValue={field.value}
                            InputLabelProps={{ shrink: true }}
                            onBlur={(e) => {
                                const val = parseValueAsInt(e.target.value);
                                field.onChange(val);
                                e.target.value = val.toString();
                            }}
                            fullWidth
                            label="Pre buffer"
                            error={!!formState.errors.video_upload?.prebuffer_sec}
                            helperText={formState.errors.video_upload?.prebuffer_sec?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        seconds
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />
                <Controller
                    name={'video_upload.postbuffer_sec'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            defaultValue={field.value}
                            InputLabelProps={{ shrink: true }}
                            onBlur={(e) => {
                                const val = parseValueAsInt(e.target.value);
                                field.onChange(val);
                                e.target.value = val.toString();
                            }}
                            fullWidth
                            label="Post buffer"
                            error={!!formState.errors.video_upload?.postbuffer_sec}
                            helperText={formState.errors.video_upload?.postbuffer_sec?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        seconds
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />
            </StyledRow>
        </Stack>
    );
};

const StyledGrid = styled('div')<{
    $numberOfColumns?: number;
    $labelColumnSpan?: number;
    $gridAutoFlow?: 'column' | 'row';
}>`
    width: 100%;
    display: grid;
    row-gap: 8px;
    column-gap: 16px;
    grid-template-columns: repeat(${({ $numberOfColumns }) => $numberOfColumns ?? 2}, 1fr);
    grid-template-rows: auto auto auto auto;
    grid-auto-flow: ${({ $gridAutoFlow }) => $gridAutoFlow ?? 'column'};

    & > label {
        grid-column: span ${({ $labelColumnSpan }) => $labelColumnSpan ?? 2};
    }

    @media only screen and (max-width: 600px) {
        & {
            grid-template-columns: 1fr;
            grid-template-rows: unset;
            grid-auto-flow: row;
        }

        & > label {
            grid-column: span 1;
        }
    }
`;
