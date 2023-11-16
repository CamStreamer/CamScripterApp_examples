import FormLabel from '@mui/material/FormLabel';
import React from 'react';
import Typography from '@mui/material/Typography';

type Props = {
    text: string;
};

export const SubSectionLabel = ({ text }: Props) => {
    return (
        <FormLabel>
            <Typography fontWeight={800} fontSize="0.875">
                {text}
            </Typography>
        </FormLabel>
    );
};
