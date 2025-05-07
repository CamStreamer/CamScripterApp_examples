import { Controller, useFormContext } from 'react-hook-form';
import { TServerData } from '../models/schema';
import { InputAdornment, MenuItem } from '@mui/material';
import { StyledTextField, StyledSelect, StyledForm } from '../components/FormInputs';
import { parseValueAsInt, parseValueAsFloat } from '../utils';
import { COORD_LIST, COORD_LIST_LABELS, UNITS, UNITS_LABELS } from './constants/constants';
import { Title } from '../components/Title';

type Props = {
    resolutionOptions: string[];
};

export const WidgetSettings = ({ resolutionOptions }: Props) => {
    const { control } = useFormContext<TServerData>();

    return (
        <StyledForm>
            <Title text="Graphics settings" />

            {/* ------RESOLUTION------*/}
            <Controller
                name={'widget.stream_resolution'}
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
                name={'widget.coord_system'}
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
                name={'widget.pos_x'}
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
                        error={!!formState.errors.widget?.pos_x}
                        helperText={formState.errors.widget?.pos_x?.message}
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
                name={'widget.pos_y'}
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
                        error={!!formState.errors.widget?.pos_y}
                        helperText={formState.errors.widget?.pos_y?.message}
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
                                    &#37;
                                </InputAdornment>
                            ),
                        }}
                    />
                )}
            />

            {/* ------UNITS------*/}
            <Controller
                name={'widget.units'}
                control={control}
                render={({ field }) => (
                    <StyledSelect {...field} label="Units">
                        {UNITS.map((value) => (
                            <MenuItem key={value} value={value}>
                                {UNITS_LABELS[value]}
                            </MenuItem>
                        ))}
                    </StyledSelect>
                )}
            />
        </StyledForm>
    );
};
