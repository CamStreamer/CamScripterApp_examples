import React, { useState } from 'react';

import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';

type Props = {
    children: React.ReactNode;
    label: string;
    defaultExpanded: boolean;
};

export const CollapsibleFormSection = ({ label, defaultExpanded, children }: Props) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    return (
        <Stack spacing={expanded ? 2 : 0}>
            <StyledTextWrapper
                onClick={() => {
                    setExpanded((prev) => !prev);
                }}
            >
                <StyledLabelText textTransform="uppercase" fontWeight="bold">
                    {label}
                </StyledLabelText>
                <StyledExpandMore expand={expanded} aria-expanded={expanded} aria-label="show more">
                    <ExpandMoreIcon />
                </StyledExpandMore>
                <StyledDivider orientation="horizontal" />
            </StyledTextWrapper>
            <Collapse in={expanded}>{children}</Collapse>
        </Stack>
    );
};

const StyledExpandMore = styled(
    (
        props: {
            expand: boolean;
        } & IconButtonProps
    ) => {
        const { expand, ...other } = props;
        void expand;
        return <IconButton {...other} />;
    }
)(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
    }),
}));

const StyledTextWrapper = styled('span')({
    cursor: 'pointer',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
});

const StyledLabelText = styled(Typography)({
    fontSize: '1em',
});

const StyledDivider = styled(Divider)({
    flex: 1,
});
