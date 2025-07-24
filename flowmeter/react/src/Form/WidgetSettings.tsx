import { Controller, useFormContext } from 'react-hook-form';
import { TSettings } from '../models/schema';
import { InputAdornment, MenuItem } from '@mui/material';
import { StyledTextField, StyledSelect, StyledForm } from '../components/FormInputs';
import { parseValueAsInt, parseValueAsFloat } from '../utils';
import { Title } from '../components/Title';
import { COORD_LIST, COORD_LIST_LABELS } from '../constants';

type Props = {
    resolutionOptions: string[];
};

export const WidgetSettings = ({ resolutionOptions }: Props) => {
    const { control } = useFormContext<TSettings>();

    return (
        <StyledForm>
            <Title text="Graphics settings" />

            {/* ------RESOLUTION------*/}
            <Controller
                name={'resolution'}
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

            {/* ------POSITION------*/}
            <Controller
                name={'coord'}
                control={control}
                render={({ field }) => (
                    <StyledSelect {...field} label="Position">
                        {COORD_LIST.map((value) => (
                            <MenuItem key={value} value={value}>
                                {COORD_LIST_LABELS[value]}
                            </MenuItem>
                        ))}
                    </StyledSelect>
                )}
            />

            {/* ------OFFSET X------*/}
            <Controller
                name={'pos_x'}
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
                        error={!!formState.errors.pos_x}
                        helperText={formState.errors.pos_x?.message}
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

            {/* ------OFFSET Y------*/}
            <Controller
                name={'pos_y'}
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
                        error={!!formState.errors.pos_y}
                        helperText={formState.errors.pos_y?.message}
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

            {/* ------SCALE------*/}
            <Controller
                name={'scale'}
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
                        error={!!formState.errors.scale}
                        helperText={formState.errors.scale?.message}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end" disableTypography>
                                    &#37;
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            />
        </StyledForm>
    );
};
