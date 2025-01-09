import { FormHelperText, MenuItem } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { TServerData } from '../../models/schema';
import { StyledSelect, StyledForm, StyledRow } from '../../components/FormInputs';
import { ViewAreaPicker } from '../../components/ViewAreaPicker';
import { TCameraListOption } from '../../hooks/useCameraList';

type Props = {
    viewAreaList: TCameraListOption[];
    resolutionOptions: string[];
};

export const UploadImageConfiguration = ({ viewAreaList, resolutionOptions }: Props) => {
    const { control } = useFormContext<TServerData>();

    return (
        <StyledRow>
            <StyledForm>
                {/* ------VIEW AREAS------*/}
                <Controller
                    name="image_upload.camera_list"
                    control={control}
                    render={({ field, formState }) => (
                        <ViewAreaPicker
                            {...field}
                            viewAreaList={viewAreaList}
                            onChange={(data) => field.onChange(data)}
                            error={!!formState.errors.image_upload?.camera_list}
                            helperText={formState.errors.image_upload?.camera_list?.message}
                        />
                    )}
                />
                <FormHelperText>Select view area as a source of media files.</FormHelperText>
            </StyledForm>
            <StyledForm>
                {/* ------RESOLUTION------*/}
                <Controller
                    name={'image_upload.resolution'}
                    control={control}
                    render={({ field }) => (
                        <StyledSelect
                            defaultValue={field.value}
                            {...field}
                            label="Resolution"
                            disabled={resolutionOptions.length === 0}
                        >
                            {resolutionOptions.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option}
                                </MenuItem>
                            ))}
                        </StyledSelect>
                    )}
                />
            </StyledForm>
        </StyledRow>
    );
};
