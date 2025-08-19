import React, { useState } from 'react';

import { Collapse, Divider, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';

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

const ExpandMoreIconButton = ({ expand, ...other }: { expand: boolean } & IconButtonProps) => {
    return <IconButton {...other} />;
};

const StyledExpandMore = styled(ExpandMoreIconButton)`
    transform: ${({ expand }) => (expand ? 'rotate(180deg)' : 'rotate(0deg)')};
    transition: ${({ theme }) =>
        theme.transitions.create('transform', {
            duration: theme.transitions.duration.shortest,
        })};
`;

const StyledTextWrapper = styled('span')`
    cursor: pointer;
    display: flex;
    gap: 8px;
    align-items: center;
`;

const StyledLabelText = styled(Typography)`
    font-size: 1em;
`;

const StyledDivider = styled(Divider)`
    flex: 1;
`;
