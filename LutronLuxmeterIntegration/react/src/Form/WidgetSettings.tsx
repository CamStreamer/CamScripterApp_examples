import styled from '@emotion/styled';
import { Box, FormHelperText, InputAdornment, MenuItem } from '@mui/material';
import { Control, Controller } from 'react-hook-form';
import { TServerData } from '../models/schema';
import { StyledSelect, StyledTextField } from '../components/FormInputs';
import { COORD_LIST, coordOptionLabels, parseValueAsFloat, parseValueAsInt } from '../utils';

type Props = {
    control: Control<TServerData>;
};

export const WidgetSettings = ({ control }: Props) => {
    return (
        <StyledForm>
            <StyledSection>
                <Controller
                    name={'widget.coAlignment'}
                    control={control}
                    render={({ field }) => (
                        <StyledSelect {...field} label="Position">
                            {COORD_LIST.map((value) => (
                                <MenuItem key={value} value={value}>
                                    {coordOptionLabels[value]}
                                </MenuItem>
                            ))}
                        </StyledSelect>
                    )}
                />
                <Controller
                    name={'widget.x'}
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
                            label="Position X"
                            error={!!formState.errors.widget?.x}
                            helperText={formState.errors.widget?.x?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        px
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />
                <Controller
                    name={'widget.y'}
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
                            label="Position Y"
                            error={!!formState.errors.widget?.y}
                            helperText={formState.errors.widget?.y?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        px
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />
                <Controller
                    name={'widget.screenWidth'}
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
                            label="Stream width"
                            error={!!formState.errors.widget?.screenWidth}
                            helperText={formState.errors.widget?.screenWidth?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        px
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />
                <Controller
                    name={'widget.screenHeight'}
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
                            label="Stream height"
                            error={!!formState.errors.widget?.screenHeight}
                            helperText={formState.errors.widget?.screenHeight?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        px
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />
                <Controller
                    name={'widget.scale'}
                    control={control}
                    render={({ field, formState }) => (
                        <StyledTextField
                            defaultValue={field.value}
                            fullWidth
                            label="Scale"
                            InputLabelProps={{ shrink: true }}
                            onBlur={(e) => {
                                const val = parseValueAsFloat(e.target.value);
                                field.onChange(val);
                                e.target.value = val.toString();
                            }}
                            error={!!formState.errors.widget?.scale}
                            helperText={formState.errors.widget?.scale?.message}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end" disableTypography>
                                        %
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}
                />
                <FormHelperText> Displaying widget for selected time, seconds.</FormHelperText>
            </StyledSection>
        </StyledForm>
    );
};

const StyledForm = styled(Box)({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
});

const StyledSection = styled(Box)({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
});
