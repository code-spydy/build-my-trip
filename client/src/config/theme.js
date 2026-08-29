import { theme } from "antd";

const { defaultAlgorithm } = theme;

const themeConfig = {
  algorithm: defaultAlgorithm,

  token: {
    colorPrimary: "#E8623D",
    colorInfo: "#0F766E",
    colorWarning: "#F2A93B",

    borderRadius: 12,

    controlHeight: 44,

    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',

    colorText: "#2B3A42",

    colorBgBase: "#FAFAFA",

    colorBgContainer: "#FFFFFF",
  },

  components: {
    Button: {
      borderRadius: 12,
      controlHeight: 44,
    },

    Input: {
      controlHeight: 44,
      borderRadius: 12,
    },

    Select: {
      controlHeight: 44,
      borderRadius: 12,
    },

    Modal: {
      borderRadius: 20,
    },
  },
};

export default themeConfig;
