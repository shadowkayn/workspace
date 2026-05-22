Component({
  data: {
    selected: 0,
    color: "#AAABB8",
    selectedColor: "#3F72AF",
    backgroundColor: "#fbf7ef",
    list: [
      {
        pagePath: "/pages/clarity/index",
        text: "拾光",
        iconPath: "/images/icons/moon.png",
        selectedIconPath: "/images/icons/moon_active.png"
      },
      {
        pagePath: "/pages/release/index",
        text: "释怀",
        iconPath: "/images/icons/file-shred-line.png",
        selectedIconPath: "/images/icons/file-shred-line-active.png"
      },
      {
        pagePath: "/pages/breathe/index",
        text: "觉察",
        iconPath: "/images/icons/col_seal_tuihui.png",
        selectedIconPath: "/images/icons/col_seal_tuihui_active.png"
      },
      {
        pagePath: "/pages/profile/index",
        text: "归处",
        iconPath: "/images/icons/mine.png",
        selectedIconPath: "/images/icons/mine_active.png"
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });
    }
  }
});
