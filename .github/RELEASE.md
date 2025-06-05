# Release Process Documentation

This document explains how to create and publish new releases of the my-toolbox application using GitHub Actions.

## Automated Release Process

The project is configured with GitHub Actions workflows that automatically build and release the application when a new version tag is pushed to the repository.

### How to Create a New Release

1. **Update Version Numbers**:
   - Update the version in `package.json`
   - Update the version in `src-tauri/tauri.conf.json`
   - Update the version in `src-tauri/Cargo.toml`

2. **Commit Your Changes**:
   ```bash
   git add .
   git commit -m "Bump version to x.y.z"
   ```

3. **Create and Push a New Tag**:
   ```bash
   git tag vx.y.z
   git push origin vx.y.z
   ```
   Replace `x.y.z` with the semantic version number (e.g., `v0.2.0`).

4. **Monitor the Release Process**:
   - Go to the GitHub repository's "Actions" tab to monitor the build progress.
   - The workflow will build the application for macOS, Windows, and Linux.
   - A draft release will be created with all platform-specific binaries attached.

5. **Publish the Release**:
   - Once the workflow completes, go to the "Releases" section in your GitHub repository.
   - You'll find a draft release with all the build artifacts attached.
   - Review the generated release and its attached files.
   - Add release notes detailing what has changed in this version.
   - When ready, click "Publish release" to make it public.

## Troubleshooting

If the GitHub Actions workflow fails:

1. Check the workflow logs in the "Actions" tab for specific error messages.
2. Common issues include:
   - Mismatched version numbers across files
   - Missing dependencies
   - Build errors in the code

## Manual Release Process (if needed)

If you need to create a release manually:

1. Build the application locally:
   ```bash
   pnpm install
   pnpm tauri build
   ```

2. Go to the GitHub repository and click on "Releases" > "Draft a new release".
3. Enter the tag version (e.g., `vx.y.z`).
4. Upload the build artifacts found in:
   - Windows: `src-tauri/target/release/bundle/msi/`
   - macOS: `src-tauri/target/release/bundle/dmg/`
   - Linux: `src-tauri/target/release/bundle/appimage/` and `src-tauri/target/release/bundle/deb/`
5. Add release notes and publish the release.

## Versioning Guidelines

We follow Semantic Versioning (SemVer):

- **Major version (x.0.0)**: Incompatible API changes
- **Minor version (0.x.0)**: New functionality in a backward-compatible manner
- **Patch version (0.0.x)**: Backward-compatible bug fixes

## Changelog Management

Consider maintaining a `CHANGELOG.md` file in the root of the project to track changes between versions.