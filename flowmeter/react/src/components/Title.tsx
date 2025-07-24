import { Typography, styled } from '@mui/material';

type Props = {
    text: string;
};

export const Headline = ({ text }: Props) => {
    return <StyledHeadeline variant="h5">{text}</StyledHeadeline>;
};

const StyledHeadeline = styled(Typography)`
    font-weight: 600;
`;

export const Title = ({ text }: Props) => {
    return <StyledTitle variant="h6">{text}</StyledTitle>;
};

const StyledTitle = styled(Typography)`
    font-weight: 600;
`;
